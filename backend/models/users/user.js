const mongoose = require("mongoose");

// schema design
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "please provide email"],
      minlength: 1,
      lowercase: true,
      trim: true,
    },
    user_name: {
      type: String,
      minlength: 1,
      maxlength: 20,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    user_type: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      default: "user",
    },
    is_blocked: {
      type: Boolean,
      default: false,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    email_verify_token: String,
    password_reset_token: String,
    password_reset_expires: Date,
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
