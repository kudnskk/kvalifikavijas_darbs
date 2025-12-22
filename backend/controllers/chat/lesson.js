const Lesson = require("../../models/chat/lesson");
const Category = require("../../models/chat/category");
const Message = require("../../models/chat/message");

const Activity = require("../../models/activities/activity");
const ActivityQuestion = require("../../models/activities/activity_question");
const ActivityAnswer = require("../../models/activities/activity_answer");
const ActivityAttempt = require("../../models/attempt/activity_attempt");
const ActivityAttemptAnswer = require("../../models/attempt/activity_attempt_answer");

const createLesson = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { title, category_id } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: false,
        message: "Not all required input fields are filled in!",
      });
    }

    const normalizedTitle = title.trim();

    const existingLesson = await Lesson.findOne({
      user_id: userId,
      title: normalizedTitle,
    });

    if (existingLesson) {
      return res.status(409).json({
        status: false,
        message: "Lesson name must be unique!",
      });
    }

    if (category_id) {
      const category = await Category.findOne({
        _id: category_id,
        user_id: userId,
      });

      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Selected catecory does not exist!",
        });
      }
    }

    const newLesson = new Lesson({
      title: normalizedTitle,
      category_id: category_id || null,
      user_id: userId,
      status: "not-started",
    });

    await newLesson.save();

    if (category_id) {
      await Category.findByIdAndUpdate(category_id, {
        $push: { lessons: newLesson._id },
      });
    }

    return res.status(201).json({
      status: true,
      message: "Lesson created successfully",
      data: newLesson,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to create lesson",
      error: error.message,
    });
  }
};

const updateLesson = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { lessonId } = req.params;
    const { title, category_id } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: false,
        message: "Not all required input fields are filled in!",
      });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "This lesson does not exist!",
      });
    }

    if (String(lesson.user_id) !== String(userId)) {
      return res.status(403).json({
        status: false,
        message: "This lesson does not belong to you!",
      });
    }

    const duplicate = await Lesson.findOne({
      user_id: userId,
      title: title.trim(),
      _id: { $ne: lessonId },
    });

    if (duplicate) {
      return res.status(409).json({
        status: false,
        message: "Lesson name must be unique!",
      });
    }

    const previousCategoryId = lesson.category_id
      ? String(lesson.category_id)
      : null;

    let nextCategoryId = null;
    if (category_id) {
      const category = await Category.findOne({
        _id: category_id,
        user_id: userId,
      });

      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Selected catecory does not exist!",
        });
      }
      nextCategoryId = String(category._id);
    }

    lesson.title = title.trim();

    lesson.category_id = nextCategoryId || null;
    await lesson.save();

    if (previousCategoryId !== nextCategoryId) {
      if (previousCategoryId) {
        await Category.findByIdAndUpdate(previousCategoryId, {
          $pull: { lessons: lesson._id },
        });
      }
      if (nextCategoryId) {
        await Category.findByIdAndUpdate(nextCategoryId, {
          $addToSet: { lessons: lesson._id },
        });
      }
    }

    return res.status(200).json({
      status: true,
      message: "Lesson updated successfully!",
      data: lesson,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to update lesson",
      error: error.message,
    });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "This lesson does not exist!",
      });
    }

    if (String(lesson.user_id) !== String(userId)) {
      return res.status(403).json({
        status: false,
        message: "This lesson does not belong to you!",
      });
    }

    const categoryId = lesson.category_id ? String(lesson.category_id) : null;

    const activityDocs = await Activity.find({ lesson_id: lessonId })
      .select("_id")
      .lean();
    const activityIds = activityDocs.map((a) => a._id);

    const questionDocs = activityIds.length
      ? await ActivityQuestion.find({ activity_id: { $in: activityIds } })
          .select("_id")
          .lean()
      : [];
    const questionIds = questionDocs.map((q) => q._id);

    const attemptDocs = activityIds.length
      ? await ActivityAttempt.find({ activity_id: { $in: activityIds } })
          .select("_id")
          .lean()
      : [];
    const attemptIds = attemptDocs.map((a) => a._id);

    if (attemptIds.length) {
      await ActivityAttemptAnswer.deleteMany({
        activity_attempt_id: { $in: attemptIds },
      });
      await ActivityAttempt.deleteMany({ _id: { $in: attemptIds } });
    }

    if (questionIds.length) {
      await ActivityAnswer.deleteMany({ question_id: { $in: questionIds } });
      await ActivityQuestion.deleteMany({ _id: { $in: questionIds } });
    }

    if (activityIds.length) {
      await Activity.deleteMany({ _id: { $in: activityIds } });
    }

    await Message.deleteMany({ lesson_id: lessonId });

    await Lesson.deleteOne({ _id: lessonId });

    if (categoryId) {
      await Category.findByIdAndUpdate(categoryId, {
        $pull: { lessons: lessonId },
      });
    }

    return res.status(200).json({
      status: true,
      message: "Lesson deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to delete lesson",
      error: error.message,
    });
  }
};

const getAllUserLessons = async (req, res) => {
  try {
    const userId = res.locals.user.id;

    const lessons = await Lesson.find({ user_id: userId }).sort({
      updatedAt: -1,
    });

    return res.status(200).json({
      status: true,
      message: "Lessons fetched successfully",
      data: lessons,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch lessons",
      error: error.message,
    });
  }
};

module.exports = {
  createLesson,
  updateLesson,
  deleteLesson,
  getAllUserLessons,
};
