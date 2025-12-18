const mongoose = require("mongoose");

// schema design
const activitySchema = new mongoose.Schema(
  {
    lesson_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    title: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 40,
      trim: true,
    },
    type: {
      type: String,
      enum: ["multiple-choice", "flashcards", "text"],
      required: true,
      default: "text",
    },
    question_count: {
      type: Number,
      required: true,
      min: 1,
    },
    max_score: {
      type: Number,
    },
    message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
