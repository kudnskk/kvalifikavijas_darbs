const mongoose = require("mongoose");

// schema design
const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 20,
      trim: true,
    },
    description: {
      type: String,
      minlength: 0,
      maxlength: 100,
      trim: true,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    icon: {
      type: String,
      default: "FaBook",
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
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

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
