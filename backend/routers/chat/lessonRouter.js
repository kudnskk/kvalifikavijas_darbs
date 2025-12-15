const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const {
  createLesson,
  getAllUserLessons,
} = require("../../controllers/chat/lesson");

router.post("/create-lesson", protect, createLesson);
router.post("/get-all-user-lessons", protect, getAllUserLessons);

module.exports = router;
