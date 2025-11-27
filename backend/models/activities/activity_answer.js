const mongoose = require("mongoose");

// schema design
const activityAnswerSchema = new mongoose.Schema(
  {
    answer: {
      type: String,
      required: true,
    },
    is_correct: {
      type: Boolean,
      required: true,
    },
    question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const ActivityAnswer = mongoose.model("Activity_Answer", activityAnswerSchema);

module.exports = ActivityAnswer;
