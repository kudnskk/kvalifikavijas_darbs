const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const {
  login,
  register,
  verifyUser,
  verifyEmailCode,
  forgotPasswordRequest,
  comparePasswordToken,
  resetPassword,
} = require("../../controllers/auth/auth");

module.exports = router;

router.post("/login", login);
router.post("/register", register);
router.get("/verify", protect, verifyUser);
router.post("/verify-email", protect, verifyEmailCode);
router.post("/forgot-password", forgotPasswordRequest);
router.post("/compare-password-token", comparePasswordToken);
router.post("/reset-password", resetPassword);
module.exports = router;
