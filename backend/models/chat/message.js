const mongoose = require("mongoose");

// schema design
const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 5000,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "activity"],
      required: true,
      default: "text",
    },
    sender_type: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
      default: "user",
    },
    lesson_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
