const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const upload = require("../../utils/file_uploads/chatMessageUpload");
const {
  getMessagesByLessonId,
  createMessage,
} = require("../../controllers/chat/message");

router.get(
  "/get-all-messages-and-activities/:lessonId",
  protect,
  getMessagesByLessonId,
);
router.post("/create-message", protect, upload.single("file"), createMessage);
module.exports = router;
