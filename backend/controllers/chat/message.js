const Message = require("../../models/chat/message");
const Lesson = require("../../models/chat/lesson");
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

    console.log("Fetched messages:", messages);

    return res.status(200).json({
      status: true,
      message: "Messages fetched successfully",
      data: {
        lesson,
        messages,
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

    if (!lesson_id || (!content.trim() && !hasFile)) {
      return res.status(400).json({
        status: false,
        message: "Lesson ID and either content or a file are required",
      });
    }

    const lesson = await Lesson.findOne({
      _id: lesson_id,
      user_id: userId,
    });

    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found or does not belong to user",
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
        content: extractedFileText,
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
          console.log(`Emitted new_message to room ${lesson_id}`);
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
