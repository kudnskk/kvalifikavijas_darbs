const mongoose = require("mongoose");

// schema design
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "please provide email"],
      minlength: 1,
      maxlength: 200,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      minlength: 1,
      maxlength: 200,
      trim: true,
    },
    surname: {
      type: String,
      minlength: 1,
      maxlength: 200,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      required: true,
      trim: true,
    },
    profile_img: {
      type: String,
      default: "/avatarDefault.jpg",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
