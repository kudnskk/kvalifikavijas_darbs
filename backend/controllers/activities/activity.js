const mongoose = require("mongoose");
const Lesson = require("../../models/chat/lesson");
const Activity = require("../../models/activities/activity");
const Message = require("../../models/chat/message");
const ActivityQuestion = require("../../models/activities/activity_question");
const ActivityAnswer = require("../../models/activities/activity_answer");
const ActivityAttempt = require("../../models/attempt/activity_attempt");
const ActivityAttemptAnswer = require("../../models/attempt/activity_attempt_answer");
const {
  generateActivityData,
  gradeFreeTextAnswers,
} = require("../../utils/assistantInstructions");

const createActivity = async (req, res) => {
  try {
    const io = req.io;
    const userId = res.locals.user.id;
    const { lesson_id, title, description, type, question_count } = req.body;

    const t0 = Date.now();
    console.log("[createActivity] start", {
      userId: String(userId),
      lesson_id: String(lesson_id),
      type,
      question_count,
    });

    const mapActivityTypeToModel = (t) => {
      if (t === "multiple_choice") return "multiple_choice";
      if (t === "free_text") return "free_text";
      if (t === "flashcard") return "flashcard";

      if (t === "multiple-choice") return "multiple_choice";
      if (t === "text") return "free_text";
      if (t === "flashcards") return "flashcard";

      return null;
    };

    if (!lesson_id) {
      return res.status(400).json({
        status: false,
        message: "Lesson ID is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        status: false,
        message: "Activity type is required",
      });
    }

    const modelRequestedType = mapActivityTypeToModel(type);
    if (!modelRequestedType) {
      return res.status(400).json({
        status: false,
        message: "Invalid activity type",
      });
    }

    const parsedQuestionCount = Number(question_count);
    if (!Number.isFinite(parsedQuestionCount) || parsedQuestionCount <= 0) {
      return res.status(400).json({
        status: false,
        message: "Question count must be a positive number",
      });
    }

    const mapActivityTypeToDb = (t) => {
      if (t === "multiple_choice") return "multiple-choice";
      if (t === "free_text") return "text";
      if (t === "flashcard") return "flashcards";
      return "text";
    };

    const trimmedTitleForDedupe = String(title || "").trim();
    const trimmedDescriptionForDedupe = String(description || "").trim();
    const requestedDbType = mapActivityTypeToDb(modelRequestedType);
    const dedupeSince = new Date(Date.now() - 2 * 60 * 1000);

    if (trimmedTitleForDedupe) {
      const recentActivity = await Activity.findOne({
        lesson_id,
        title: trimmedTitleForDedupe,
        type: requestedDbType,
        question_count: parsedQuestionCount,
        createdAt: { $gte: dedupeSince },
      })
        .sort({ createdAt: -1 })
        .lean();

      if (recentActivity?.message_id) {
        const existingMessage = await Message.findById(
          recentActivity.message_id,
        ).lean();

        const expectedContent =
          trimmedDescriptionForDedupe || trimmedTitleForDedupe;
        if (existingMessage && existingMessage.type === "activity") {
          if (String(existingMessage.content || "") === expectedContent) {
            return res.status(200).json({
              status: true,
              message: "Activity already created recently",
              data: {
                ...existingMessage,
                activity_id: recentActivity._id,
                activity_title: recentActivity.title,
                activity_type: recentActivity.type,
              },
            });
          }
        }
      }
    }

    const lesson = await Lesson.findOne({ _id: lesson_id, user_id: userId });
    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found or does not belong to user",
      });
    }

    const generationResult = await generateActivityData({
      lessonId: lesson_id,
      userId,
      activityType: modelRequestedType,
      questionCount: parsedQuestionCount,
      title,
      description,
    });

    console.log("[createActivity] generation finished", {
      ms: Date.now() - t0,
      status: generationResult?.status,
      activityType: generationResult?.activityType,
      itemCount: Array.isArray(generationResult?.items)
        ? generationResult.items.length
        : null,
    });

    if (!generationResult || generationResult.status !== "ok") {
      return res.status(400).json({
        status: false,
        message:
          generationResult?.error?.message ||
          "Unable to generate activity from the provided description",
        data: {
          error: generationResult?.error || null,
        },
      });
    }

    const modelActivityType = generationResult.activityType;
    const modelItems = Array.isArray(generationResult.items)
      ? generationResult.items
      : [];

    const trimmedTitle = String(title || "").trim();
    const trimmedDescription = String(description || "").trim();

    const activityTitle =
      trimmedTitle ||
      `${String(modelActivityType || type || "activity").replaceAll("_", " ")}`;

    const activityChatDescription = trimmedDescription || activityTitle;

    const dbActivityType = mapActivityTypeToDb(modelActivityType);

    if (!modelActivityType || !modelItems.length) {
      return res.status(400).json({
        status: false,
        message: "Model returned incomplete activity data",
      });
    }

    const badRequest = (message, data) => {
      const err = new Error(message);
      err.statusCode = 400;
      err.data = data;
      throw err;
    };

    const session = await mongoose.startSession();
    let createdActivity;
    let createdMessage;

    try {
      await session.withTransaction(async () => {
        createdMessage = new Message({
          content: activityChatDescription,
          type: "activity",
          sender_type: "assistant",
          lesson_id,
          user_id: userId,
        });
        await createdMessage.save({ session });

        await Lesson.findByIdAndUpdate(
          lesson_id,
          { $push: { messages: createdMessage._id } },
          { session },
        );

        createdActivity = new Activity({
          lesson_id,
          title: activityTitle,
          type: dbActivityType,
          question_count: parsedQuestionCount,
          max_score:
            dbActivityType === "flashcards" ? undefined : parsedQuestionCount,
          message_id: createdMessage._id,
        });
        await createdActivity.save({ session });

        const items = modelItems;

        if (items.length !== parsedQuestionCount) {
          badRequest(
            `Model returned ${items.length} items, expected ${parsedQuestionCount}`,
          );
        }

        const questionDocs = [];
        for (const item of items) {
          let questionText = "";
          if (
            modelActivityType === "multiple_choice" ||
            modelActivityType === "free_text"
          ) {
            questionText = String(item.question || "").trim();
          } else if (modelActivityType === "flashcard") {
            questionText = String(item.front || "").trim();
          }

          if (!questionText) {
            badRequest("Model returned an empty question");
          }

          questionDocs.push({
            question: questionText,
            activity_id: createdActivity._id,
          });
        }

        const insertedQuestions = await ActivityQuestion.insertMany(
          questionDocs,
          { session },
        );

        const answerDocs = [];
        for (let qi = 0; qi < items.length; qi++) {
          const item = items[qi];
          const questionId = insertedQuestions[qi]._id;

          if (modelActivityType === "multiple_choice") {
            const options = Array.isArray(item.answers) ? item.answers : [];
            const correctIndexes = Array.isArray(item.correctAnswerIndices)
              ? item.correctAnswerIndices
              : [];

            if (options.length < 2) {
              badRequest(
                "Multiple-choice question must have at least 2 options",
              );
            }
            if (!correctIndexes.length) {
              badRequest(
                "Multiple-choice question must specify at least one correct option",
              );
            }

            const maxIndex = options.length - 1;
            const anyOutOfRange = correctIndexes.some(
              (idx) => !Number.isInteger(idx) || idx < 0 || idx > maxIndex,
            );
            if (anyOutOfRange) {
              badRequest(
                "Multiple-choice correctAnswerIndices contains out-of-range index",
              );
            }

            for (let i = 0; i < options.length; i++) {
              const optionText = String(options[i] || "").trim();
              if (!optionText) continue;
              answerDocs.push({
                answer: optionText,
                is_correct: correctIndexes.includes(i),
                question_id: questionId,
              });
            }
          } else if (modelActivityType === "free_text") {
            // For now: store no answers for free_text activities
          } else if (modelActivityType === "flashcard") {
            const back = String(item.back || "").trim();
            answerDocs.push({
              answer: back || "(no back provided)",
              is_correct: true,
              question_id: questionId,
            });
          }
        }

        if (answerDocs.length) {
          await ActivityAnswer.insertMany(answerDocs, { session });
        }
      });
    } finally {
      await session.endSession();
    }

    console.log("[createActivity] transaction committed", {
      ms: Date.now() - t0,
      messageId: createdMessage?._id ? String(createdMessage._id) : null,
      activityId: createdActivity?._id ? String(createdActivity._id) : null,
    });

    const newMessageBase = createdMessage?.toObject
      ? createdMessage.toObject()
      : createdMessage;

    const newMessage = {
      ...newMessageBase,
      activity_id: createdActivity?._id,
      activity_type: dbActivityType,
      activity_title: activityTitle,
    };
    // if (io && newMessage) {
    //   io.to(String(lesson_id)).emit("new_message", newMessage);
    // }

    return res.status(201).json({
      status: true,
      message: "Activity created successfully",
      data: newMessage,
    });
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({
        status: false,
        message: error.message,
        data: error.data || undefined,
      });
    }
    return res.status(500).json({
      status: false,
      message: "Failed to create activity",
      error: error.message,
    });
  }
};

const getActivitiesByLessonId = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { lessonId } = req.params;

    const lesson = await Lesson.findOne({ _id: lessonId, user_id: userId });
    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found or does not belong to user",
      });
    }

    const activities = await Activity.find({ lesson_id: lessonId })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      status: true,
      message: "Activities fetched successfully",
      data: { activities },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
};

const getActivityById = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { activityId } = req.params;

    const activity = await Activity.findById(activityId).lean();
    if (!activity) {
      return res.status(404).json({
        status: false,
        message: "Activity not found",
      });
    }

    const activityMessage = activity?.message_id
      ? await Message.findById(activity.message_id).lean()
      : null;

    const lesson = await Lesson.findOne({
      _id: activity.lesson_id,
      user_id: userId,
    }).lean();

    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found or does not belong to user",
      });
    }

    const questions = await ActivityQuestion.find({ activity_id: activityId })
      .sort({ createdAt: 1 })
      .lean();

    const questionIds = questions.map((q) => q._id);
    const answers = questionIds.length
      ? await ActivityAnswer.find({ question_id: { $in: questionIds } })
          .sort({ createdAt: 1 })
          .lean()
      : [];

    const answersByQuestionId = answers.reduce((acc, ans) => {
      const key = String(ans.question_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(ans);
      return acc;
    }, {});

    const questionsWithAnswers = questions.map((q) => ({
      ...q,
      answers: answersByQuestionId[String(q._id)] || [],
    }));

    return res.status(200).json({
      status: true,
      message: "Activity fetched successfully",
      data: {
        activity: {
          ...activity,
          description:
            typeof activityMessage?.content === "string"
              ? activityMessage.content
              : "",
        },
        questions: questionsWithAnswers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch activity",
      error: error.message,
    });
  }
};

const submitActivityAttempt = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { activityId } = req.params;
    const bodyAnswers = Array.isArray(req.body?.answers)
      ? req.body.answers
      : [];

    const activity = await Activity.findById(activityId).lean();
    if (!activity) {
      return res
        .status(404)
        .json({ status: false, message: "Activity not found" });
    }

    const lesson = await Lesson.findOne({
      _id: activity.lesson_id,
      user_id: userId,
    }).lean();
    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found or does not belong to user",
      });
    }

    const questions = await ActivityQuestion.find({ activity_id: activityId })
      .sort({ createdAt: 1 })
      .lean();

    if (!questions.length) {
      return res
        .status(400)
        .json({ status: false, message: "Activity has no questions" });
    }

    const questionIds = questions.map((q) => String(q._id));
    const answers = await ActivityAnswer.find({
      question_id: { $in: questionIds },
    }).lean();
    const answersByQuestionId = answers.reduce((acc, a) => {
      const key = String(a.question_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    }, {});

    const byQid = bodyAnswers.reduce((acc, a) => {
      const qid = String(a?.question_id || "");
      if (!qid) return acc;
      acc[qid] = a;
      return acc;
    }, {});

    const activityType = activity.type; // 'multiple-choice' | 'text' | 'flashcards'
    if (activityType !== "multiple-choice" && activityType !== "text") {
      return res
        .status(400)
        .json({ status: false, message: "Unsupported activity type" });
    }

    let perQuestionResults = [];
    if (activityType === "multiple-choice") {
      perQuestionResults = questions.map((q) => {
        const qid = String(q._id);
        const submitted = byQid[qid];
        const selectedIds = Array.isArray(submitted?.selected_answer_ids)
          ? submitted.selected_answer_ids.map(String)
          : [];

        const correctIds = (answersByQuestionId[qid] || [])
          .filter((a) => a.is_correct)
          .map((a) => String(a._id))
          .sort();

        const selectedSorted = [...new Set(selectedIds)].sort();

        const isCorrect =
          correctIds.length > 0 &&
          selectedSorted.length === correctIds.length &&
          selectedSorted.every((id, i) => id === correctIds[i]);

        return {
          question_id: qid,
          is_correct: isCorrect,
          selected_answer_ids: selectedSorted,
          text_answer: "",
        };
      });
    }

    if (activityType === "text") {
      const gradingItems = questions.map((q) => {
        const qid = String(q._id);
        const submitted = byQid[qid];
        return {
          question_id: qid,
          question: String(q.question || ""),
          user_answer: String(submitted?.text_answer || "").trim(),
        };
      });

      const graded = await gradeFreeTextAnswers({
        lessonId: activity.lesson_id,
        items: gradingItems,
      });
      if (graded.status !== "ok") {
        return res.status(400).json({
          status: false,
          message:
            graded?.error?.message || "Failed to grade free-text answers",
        });
      }

      const gradedById = graded.results.reduce((acc, r) => {
        acc[String(r.question_id)] = Boolean(r.is_correct);
        return acc;
      }, {});

      perQuestionResults = questions.map((q) => {
        const qid = String(q._id);
        const submitted = byQid[qid];
        const textAnswer = String(submitted?.text_answer || "");
        return {
          question_id: qid,
          is_correct: Boolean(gradedById[qid]),
          selected_answer_ids: [],
          text_answer: textAnswer,
        };
      });
    }

    const score = perQuestionResults.reduce(
      (sum, r) => sum + (r.is_correct ? 1 : 0),
      0,
    );

    const session = await mongoose.startSession();
    let createdAttempt;
    try {
      await session.withTransaction(async () => {
        createdAttempt = new ActivityAttempt({
          score,
          activity_id: activityId,
        });
        await createdAttempt.save({ session });

        const attemptAnswerDocs = perQuestionResults.map((r) => ({
          is_correct: r.is_correct,
          text_answer: typeof r.text_answer === "string" ? r.text_answer : "",
          activity_attempt_id: createdAttempt._id,
          activity_answer_id: Array.isArray(r.selected_answer_ids)
            ? r.selected_answer_ids
            : [],
          activity_question_id: r.question_id,
        }));

        await ActivityAttemptAnswer.insertMany(attemptAnswerDocs, { session });
      });
    } finally {
      await session.endSession();
    }

    return res.status(201).json({
      status: true,
      message: "Attempt submitted",
      data: {
        attempt: {
          _id: createdAttempt._id,
          score,
          activity_id: activityId,
        },
        results: perQuestionResults,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to submit attempt",
      error: error.message,
    });
  }
};

module.exports = {
  createActivity,
  getActivitiesByLessonId,
  getActivityById,
  submitActivityAttempt,
};
