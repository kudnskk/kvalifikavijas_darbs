const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const {
  getMessagesByLessonId,
  createMessage,
} = require("../../controllers/chat/message");

router.get(
  "/get-all-messages-and-activities/:lessonId",
  protect,
  getMessagesByLessonId,
);
router.post("/create-message", protect, createMessage);

module.exports = router;
