const mongoose = require("mongoose");

// schema design
const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["multiple-choise", "flashcards", "text"],
      required: true,
      default: "text",
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
