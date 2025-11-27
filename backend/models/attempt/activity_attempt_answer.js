const mongoose = require("mongoose");

// schema design
const activityAttemptAnswerSchema = new mongoose.Schema(
  {
    is_correct: {
      type: Boolean,
      required: true,
    },
    text_answer: {
      type: String,
      minLenfgth: 1,
      maxlength: 1000,
      trim: true,
      required: true,
    },
    activity_attempt_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity_Attempt",
      required: true,
    },
    activity_answer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity_Answer",
    },
    activity_question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity_Question",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const ActivityAttemptAnswer = mongoose.model(
  "Activity_Attempt_Answer",
  activityAttemptAnswerSchema,
);

module.exports = ActivityAttemptAnswer;
