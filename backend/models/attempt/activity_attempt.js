const mongoose = require("mongoose");

// schema design
const activityAttemptSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
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

const ActivityAttempt = mongoose.model(
  "Activity_Attempt",
  activityAttemptSchema,
);

module.exports = ActivityAttempt;
