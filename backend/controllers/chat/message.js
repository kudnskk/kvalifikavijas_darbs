const Message = require("../../models/chat/message");
const Lesson = require("../../models/chat/lesson");
const Activity = require("../../models/activities/activity");
const { generateAIResponse } = require("../../utils/assistantInstructions");
const { extractFileText } = require("../../utils/file_uploads/extractFileText");

const getMessagesByLessonId = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { lessonId } = req.params;

    // Verify lesson exists and belongs to user
    const lesson = await Lesson.findOne({
      _id: lessonId,
      user_id: userId,
    });

    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found or does not belong to user",
      });
    }

    // Get all messages for this lesson
    const messages = await Message.find({
      lesson_id: lessonId,
    })
      .sort({ createdAt: 1 })
      .lean();

    const activities = await Activity.find({ lesson_id: lessonId })
      .sort({ createdAt: 1 })
      .lean();

    // Attach activity data to the messages of type activty
    const activityByMessageId = activities.reduce((acc, activity) => {
      if (activity?.message_id) {
        acc[String(activity.message_id)] = activity;
      }
      return acc;
    }, {});

    const messagesWithActivities = messages.map((mes) => {
      if (mes?.type !== "activity") return mes;

      const activity = activityByMessageId[String(mes._id)];
      if (!activity) return mes;

      return {
        ...mes,
        activity_id: activity._id,
        activity_title: activity.title,
        activity_type: activity.type,
      };
    });

    return res.status(200).json({
      status: true,
      message: "Messages fetched successfully",
      data: {
        lesson,
        messages: messagesWithActivities,
        activities,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

const createMessage = async (req, res) => {
  try {
    const io = req.io;
    const userId = res.locals.user.id;
    const { lesson_id, content, type = "text" } = req.body;

    const hasFile = Boolean(req.file);

    if (!lesson_id || !content.trim()) {
      return res.status(400).json({
        status: false,
        message: "Not all required input fields are filled in!",
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        status: false,
        message: "Message text is longer than 5000 symbols!",
      });
    }

    const lesson = await Lesson.findOne({
      _id: lesson_id,
      user_id: userId,
    });

    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "No lesson found!",
      });
    }

    if (lesson.status === "not-started") {
      await Lesson.findByIdAndUpdate(lesson_id, { status: "in-progress" });
    }

    let extractedFileText = "";
    let fileMeta = undefined;

    if (hasFile) {
      try {
        extractedFileText = await extractFileText(req.file);
      } catch (e) {
        return res.status(400).json({
          status: false,
          message: e?.message || "Failed to extract text from file",
        });
      }

      fileMeta = {
        type: req.file.mimetype,
        file_name: req.file.originalname,
        content: extractedFileText.substring(0, 50000),
      };
    }

    const newMessage = new Message({
      content: content.trim(),
      type,
      sender_type: "user",
      lesson_id,
      user_id: userId,
      ...(fileMeta ? { file: fileMeta } : {}),
    });

    await newMessage.save();

    await Lesson.findByIdAndUpdate(lesson_id, {
      $push: { messages: newMessage._id },
    });

    const aiInput = hasFile
      ? `${content.trim()}\n\n[Attached file: ${
          req.file.originalname
        }]\n${extractedFileText}`
      : content.trim();

    //using socket send to room
    generateAIResponse(aiInput, lesson_id, userId)
      .then((aiMessage) => {
        if (aiMessage) {
          io.to(lesson_id).emit("new_message", aiMessage);
        }
      })
      .catch((error) => {
        console.error("Error generating and emitting AI response:", error);
      });

    return res.status(201).json({
      status: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

module.exports = {
  getMessagesByLessonId,
  createMessage,
};
