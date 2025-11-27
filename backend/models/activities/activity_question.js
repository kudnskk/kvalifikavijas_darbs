const mongoose = require("mongoose");

// schema design
const activityQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    activity_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const ActivityQuestion = mongoose.model(
  "Activity_Question",
  activityQuestionSchema,
);

module.exports = ActivityQuestion;
