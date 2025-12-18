const Lesson = require("../../models/chat/lesson");
const Activity = require("../../models/activities/activity");

const createActivity = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { lesson_id, title, type, question_count } = req.body;

    if (!lesson_id) {
      return res.status(400).json({
        status: false,
        message: "Lesson ID is required",
      });
    }

    const trimmedTitle = String(title || "").trim();
    if (!trimmedTitle) {
      return res.status(400).json({
        status: false,
        message: "Title is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        status: false,
        message: "Activity type is required",
      });
    }

    const parsedQuestionCount = Number(question_count);
    if (!Number.isFinite(parsedQuestionCount) || parsedQuestionCount <= 0) {
      return res.status(400).json({
        status: false,
        message: "Question count must be a positive number",
      });
    }

    // Verify lesson exists and belongs to user
    const lesson = await Lesson.findOne({ _id: lesson_id, user_id: userId });
    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found or does not belong to user",
      });
    }

    const activity = new Activity({
      lesson_id,
      title: trimmedTitle,
      type,
      question_count: parsedQuestionCount,
    });

    await activity.save();

    return res.status(201).json({
      status: true,
      message: "Activity created successfully",
      data: activity,
    });
  } catch (error) {
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

    // Verify lesson exists and belongs to user
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

module.exports = {
  createActivity,
  getActivitiesByLessonId,
};
