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
  explainActivityMistakes,
} = require("../../utils/assistantInstructions");

const createActivity = async (req, res) => {
  try {
    const io = req.io;
    const userId = res.locals.user.id;
    const { lesson_id, title, description, type, question_count } = req.body;

    const t0 = Date.now();

    if (!type || !question_count || !title || !description || !lesson_id) {
      return res.status(400).json({
        status: false,
        message: "Not all required input fields are filled in!",
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        status: false,
        message: "Activity description field is longer that 1000 letters!",
      });
    }

    if (!["multiple-choice", "flashcards", "text"].includes(type)) {
      return res.status(400).json({
        status: false,
        message:
          "Activity type must be either multiple-choice, flashcards or free-text!",
      });
    }

    if (![5, 10, 15, 20].includes(Number(question_count))) {
      return res.status(400).json({
        status: false,
        message: "Activity must be either 5, 10, 15 or 20 questions long!",
      });
    }

    const lesson = await Lesson.findOne({ _id: lesson_id, user_id: userId });
    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found!",
      });
    }

    const parsedQuestionCount = Number(question_count);

    const generationResult = await generateActivityData({
      lessonId: lesson_id,
      userId,
      activityType: type,
      questionCount: question_count,
      title,
      description,
    });

    if (!generationResult || generationResult.status !== "ok") {
      return res.status(400).json({
        status: false,
        message: generationResult?.error || "OpenAI response failed!",
      });
    }

    const activityType = generationResult.activityType;
    const modelItems = Array.isArray(generationResult.items)
      ? generationResult.items
      : [];

    const trimmedTitle = String(title || "").trim();
    const trimmedDescription = String(description || "").trim();

    const activityTitle =
      trimmedTitle ||
      `${String(activityType || type || "activity").replaceAll("-", " ")}`;

    const activityChatDescription = trimmedDescription || activityTitle;

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
          type: activityType,
          question_count: parsedQuestionCount,
          max_score:
            activityType === "flashcards" ? undefined : parsedQuestionCount,
          message_id: createdMessage._id,
        });
        await createdActivity.save({ session });

        const questionDocs = [];
        for (const item of modelItems) {
          let questionText = "";
          if (activityType === "multiple-choice" || activityType === "text") {
            questionText = item.question;
          } else if (activityType === "flashcards") {
            questionText = item.front;
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

        //create answer
        const answerDocs = [];
        for (
          let questionIndex = 0;
          questionIndex < modelItems.length;
          questionIndex++
        ) {
          const item = modelItems[questionIndex];
          const questionId = insertedQuestions[questionIndex]._id;

          if (activityType === "multiple-choice") {
            for (let i = 0; i < item.answers.length; i++) {
              answerDocs.push({
                answer: item.answers[i],
                is_correct: item.correctAnswerIndices.includes(i),
                question_id: questionId,
              });
            }
          } else if (activityType === "flashcards") {
            answerDocs.push({
              answer: item.back,
              is_correct: true,
              question_id: questionId,
            });
          }
        }

        await ActivityAnswer.insertMany(answerDocs, { session });
      });
    } finally {
      await session.endSession();
    }

    const newMessageBase = createdMessage?.toObject
      ? createdMessage.toObject()
      : createdMessage;

    const newMessage = {
      ...newMessageBase,
      activity_id: createdActivity?._id,
      activity_type: activityType,
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
    //get message that is part of the activity
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
    // get activity data: quesitons + answers
    const questions = await ActivityQuestion.find({ activity_id: activityId })
      .sort({ createdAt: 1 })
      .lean();

    const questionIds = questions.map((q) => q._id);
    const answers = questionIds.length
      ? await ActivityAnswer.find({ question_id: { $in: questionIds } })
          .sort({ createdAt: 1 })
          .lean()
      : [];

    //group answers by question
    const answersByQuestionId = {};
    for (const answer of answers) {
      const key = String(answer.question_id);
      if (!answersByQuestionId[key]) answersByQuestionId[key] = [];
      answersByQuestionId[key].push(answer);
    }

    const questionsWithAnswers = questions.map((q) => ({
      ...q,
      answers: answersByQuestionId[String(q._id)] || [],
    }));

    let attemptsWithAnswers = [];
    if (activity.type === "multiple-choice" || activity.type === "text") {
      const attempts = await ActivityAttempt.find({ activity_id: activityId })
        .sort({ createdAt: 1 })
        .lean();

      const attemptIds = attempts.map((a) => a._id);
      const attemptAnswers = attemptIds.length
        ? await ActivityAttemptAnswer.find({
            activity_attempt_id: { $in: attemptIds },
          })
            .sort({ createdAt: 1 })
            .lean()
        : [];

      //group answers by attempt
      const answersByAttemptId = {};
      for (const answer of attemptAnswers) {
        const key = String(answer.activity_attempt_id);
        if (!answersByAttemptId[key]) answersByAttemptId[key] = [];
        answersByAttemptId[key].push(answer);
      }

      attemptsWithAnswers = attempts.map((a) => ({
        ...a,
        answers: answersByAttemptId[String(a._id)] || [],
      }));
    }

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
        attempts: attemptsWithAnswers,
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

const getActivityAttemptsByActivityId = async (req, res) => {
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

    if (activity.type !== "multiple-choice" && activity.type !== "text") {
      return res.status(200).json({
        status: true,
        message: "Attempts fetched successfully",
        data: { attempts: [] },
      });
    }

    const attempts = await ActivityAttempt.find({ activity_id: activityId })
      .sort({ createdAt: 1 })
      .lean();

    const attemptIds = attempts.map((a) => a._id);
    const attemptAnswers = attemptIds.length
      ? await ActivityAttemptAnswer.find({
          activity_attempt_id: { $in: attemptIds },
        })
          .sort({ createdAt: 1 })
          .lean()
      : [];

    // Group answers by attempt
    const answersByAttemptId = {};
    for (const answer of attemptAnswers) {
      const key = String(answer.activity_attempt_id);
      if (!answersByAttemptId[key]) answersByAttemptId[key] = [];
      answersByAttemptId[key].push(answer);
    }

    const attemptsWithAnswers = attempts.map((a) => ({
      ...a,
      answers: answersByAttemptId[String(a._id)] || [],
    }));

    return res.status(200).json({
      status: true,
      message: "Attempts fetched successfully",
      data: { attempts: attemptsWithAnswers },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch attempts",
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

    // group answers by question
    const answersByQuestionId = {};
    for (const answer of answers) {
      const key = String(answer.question_id);
      if (!answersByQuestionId[key]) answersByQuestionId[key] = [];
      answersByQuestionId[key].push(answer);
    }

    // group submitted answers by question
    const submittedByQuestionId = {};
    for (const answer of bodyAnswers) {
      const questionId = String(answer?.question_id || "");
      if (questionId) {
        submittedByQuestionId[questionId] = answer;
      }
    }

    const activityType = activity.type; // 'multiple-choice' | 'text' | 'flashcards'
    if (activityType !== "multiple-choice" && activityType !== "text") {
      return res
        .status(400)
        .json({ status: false, message: "Unsupported activity type" });
    }

    // grade the attempt
    let perQuestionResults = [];
    if (activityType === "multiple-choice") {
      for (const question of questions) {
        const questionId = String(question._id);
        const submitted = submittedByQuestionId[questionId];
        const selectedIds = submitted?.selected_answer_ids || [];

        //find correct answers
        const correctIds = [];
        for (const answer of answersByQuestionId[questionId] || []) {
          if (answer.is_correct) {
            correctIds.push(String(answer._id));
          }
        }
        correctIds.sort();

        const selectedSorted = [...new Set(selectedIds.map(String))].sort();

        // check if answer is correct
        const isCorrect =
          correctIds.length > 0 &&
          selectedSorted.length === correctIds.length &&
          selectedSorted.every((id, i) => id === correctIds[i]);

        perQuestionResults.push({
          question_id: questionId,
          is_correct: isCorrect,
          selected_answer_ids: selectedSorted,
          text_answer: "",
        });
      }
    }

    if (activityType === "text") {
      // prepare items for grading
      const gradingItems = [];
      for (const question of questions) {
        const questionId = String(question._id);
        const submitted = submittedByQuestionId[questionId];
        gradingItems.push({
          question_id: questionId,
          question: question.question,
          user_answer: submitted?.text_answer || "",
        });
      }

      const graded = await gradeFreeTextAnswers({
        lessonId: activity.lesson_id,
        items: gradingItems,
      });

      // Map graded results by question ID
      const gradedByQuestionId = {};
      for (const result of graded.results) {
        gradedByQuestionId[String(result.question_id)] = result.is_correct;
      }

      // Build results
      for (const question of questions) {
        const questionId = String(question._id);
        const submitted = submittedByQuestionId[questionId];
        perQuestionResults.push({
          question_id: questionId,
          is_correct: gradedByQuestionId[questionId] || false,
          selected_answer_ids: [],
          text_answer: submitted?.text_answer || "",
        });
      }
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

const explainActivityAttemptMistakes = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { activityId, attemptId } = req.params;

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

    if (activity.type !== "multiple-choice" && activity.type !== "text") {
      return res
        .status(400)
        .json({ status: false, message: "Unsupported activity type" });
    }

    const attempt = await ActivityAttempt.findOne({
      _id: attemptId,
      activity_id: activityId,
    }).lean();
    if (!attempt) {
      return res.status(404).json({
        status: false,
        message: "Attempt not found",
      });
    }

    const attemptAnswers = await ActivityAttemptAnswer.find({
      activity_attempt_id: attemptId,
    })
      .sort({ createdAt: 1 })
      .lean();

    const wrongAttemptAnswers = attemptAnswers.filter((a) => !a?.is_correct);
    if (!wrongAttemptAnswers.length) {
      return res.status(400).json({
        status: false,
        message: "No mistakes to explain",
      });
    }

    const questions = await ActivityQuestion.find({ activity_id: activityId })
      .sort({ createdAt: 1 })
      .lean();

    // map questions by id
    const questionsById = {};
    for (const question of questions) {
      questionsById[String(question._id)] = question;
    }

    let answersById = {};
    if (activity.type === "multiple-choice") {
      const questionIds = questions.map((q) => String(q._id));
      const answers = await ActivityAnswer.find({
        question_id: { $in: questionIds },
      }).lean();

      // map answers by id
      for (const answer of answers) {
        answersById[String(answer._id)] = answer;
      }
    }

    const itemsForAi = wrongAttemptAnswers.map((wa) => {
      const qid = String(wa.activity_question_id);
      const q = questionsById[qid];
      const questionText = String(q?.question || "");

      if (activity.type === "multiple-choice") {
        const selectedIds = Array.isArray(wa.activity_answer_id)
          ? wa.activity_answer_id.map(String)
          : [];

        const selectedAnswersText = selectedIds
          .map((id) => answersById[id])
          .filter(Boolean)
          .map((a) => String(a.answer || ""))
          .filter(Boolean);

        const correctAnswersText = Object.values(answersById)
          .filter(
            (a) =>
              String(a.question_id) === qid &&
              Boolean(a.is_correct) &&
              typeof a.answer === "string" &&
              a.answer.trim(),
          )
          .map((a) => a.answer.trim());

        return {
          question_id: qid,
          question: questionText,
          user_selected_answers: selectedAnswersText,
          correct_answers: correctAnswersText,
        };
      }

      // free-text
      return {
        question_id: qid,
        question: questionText,
        user_answer: String(wa.text_answer || "").trim(),
      };
    });

    const explained = await explainActivityMistakes({
      lessonId: activity.lesson_id,
      items: itemsForAi,
    });

    if (explained.status !== "ok") {
      return res.status(400).json({
        status: false,
        message: explained?.error?.message || "Failed to explain mistakes",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Mistakes explained",
      data: {
        attempt: {
          _id: attempt._id,
          score: attempt.score,
          activity_id: activityId,
        },
        explanations: explained.explanations,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to explain mistakes",
      error: error.message,
    });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { activityId } = req.params;

    const activity = await Activity.findById(activityId).lean();
    if (!activity) {
      return res
        .status(404)
        .json({ status: false, message: "Activity not found" });
    }

    //validare the request
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
    //first delete all the answers, then questions, then ActivityAttemptAnswer, then attempts,
    //delete the message pull it out of the lesson and
    //only then delete the acticity
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const questions = await ActivityQuestion.find({
          activity_id: activityId,
        }).session(session);
        const questionIds = questions.map((q) => q._id);

        if (questionIds.length) {
          await ActivityAnswer.deleteMany(
            { question_id: { $in: questionIds } },
            { session },
          );
        }

        await ActivityQuestion.deleteMany(
          { activity_id: activityId },
          { session },
        );

        const attempts = await ActivityAttempt.find({
          activity_id: activityId,
        }).session(session);
        const attemptIds = attempts.map((a) => a._id);

        if (attemptIds.length) {
          await ActivityAttemptAnswer.deleteMany(
            { activity_attempt_id: { $in: attemptIds } },
            { session },
          );
        }

        await ActivityAttempt.deleteMany(
          { activity_id: activityId },
          { session },
        );

        if (activity.message_id) {
          await Message.findByIdAndDelete(activity.message_id, { session });

          await Lesson.findByIdAndUpdate(
            activity.lesson_id,
            { $pull: { messages: activity.message_id } },
            { session },
          );
        }

        await Activity.findByIdAndDelete(activityId, { session });
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      status: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to delete activity",
      error: error.message,
    });
  }
};

const regenerateActivity = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { activityId } = req.params;

    //validate the request
    const activity = await Activity.findById(activityId).lean();
    if (!activity) {
      return res.status(404).json({
        status: false,
        message: "Activity not found",
      });
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

    //get acitivyt question and get the text from them
    const existingQuestions = await ActivityQuestion.find({
      activity_id: activityId,
    })
      .sort({ createdAt: 1 })
      .lean();

    const existingQuestionTexts = existingQuestions.map((q) => q.question);

    // get activity description
    const activityMessage = await Message.findById(activity.message_id).lean();
    const description = activityMessage.content;

    // generate new activity with old question attached
    const generationResult = await generateActivityData({
      lessonId: activity.lesson_id,
      userId,
      activityType: activity.type,
      questionCount: activity.question_count,
      title: activity.title,
      description,
      existingQuestions: existingQuestionTexts,
    });

    if (!generationResult || generationResult.status !== "ok") {
      return res.status(400).json({
        status: false,
        message: "OpenAI response failed!",
      });
    }

    const activityType = generationResult.activityType;

    if (!generationResult.items.length) {
      return res.status(400).json({
        status: false,
        message: "OpenAI response failed!",
      });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        //delete all attempt data
        const attemptIds = (
          await ActivityAttempt.find({ activity_id: activityId })
            .select("_id")
            .lean()
        ).map((a) => a._id);

        if (attemptIds.length) {
          await ActivityAttemptAnswer.deleteMany(
            { activity_attempt_id: { $in: attemptIds } },
            { session },
          );
          await ActivityAttempt.deleteMany(
            { activity_id: activityId },
            { session },
          );
        }

        //delete old answers
        await ActivityAnswer.deleteMany(
          { question_id: { $in: existingQuestions.map((q) => q._id) } },
          { session },
        );

        // Update existing questions or create new ones if needed
        const questionUpdates = [];

        for (let i = 0; i < generationResult.items.length; i++) {
          const item = generationResult.items[i];
          let questionText = "";

          if (activityType === "multiple-choice" || activityType === "text") {
            questionText = String(item.question || "").trim();
          } else if (activityType === "flashcards") {
            questionText = String(item.front || "").trim();
          }
          //update question text
          questionUpdates.push({
            updateOne: {
              filter: { _id: existingQuestions[i]._id },
              update: { $set: { question: questionText } },
            },
          });
        }
        if (questionUpdates.length) {
          await ActivityQuestion.bulkWrite(questionUpdates, { session });
        }

        // create new answers
        const answerDocs = [];
        for (let index = 0; index < generationResult.items.length; index++) {
          const item = generationResult.items[index];
          const questionId = existingQuestions[index]._id;
          if (activityType === "multiple-choice") {
            // create each new answer option linked to the question
            for (let i = 0; i < item.answers.length; i++) {
              answerDocs.push({
                answer: item.answers[i],
                is_correct: item.correctAnswerIndices.includes(i),
                question_id: questionId,
              });
            }
          } else if (activityType === "flashcards") {
            // create back side linked to the front side

            answerDocs.push({
              answer: item.back,
              is_correct: true,
              question_id: questionId,
            });
          }
        }

        await ActivityAnswer.insertMany(answerDocs, { session });
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      status: true,
      message: "Activity regenerated successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to regenerate activity",
      error: error.message,
    });
  }
};

module.exports = {
  createActivity,
  getActivitiesByLessonId,
  getActivityById,
  getActivityAttemptsByActivityId,
  submitActivityAttempt,
  explainActivityAttemptMistakes,
  deleteActivity,
  regenerateActivity,
};
