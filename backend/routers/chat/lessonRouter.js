const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const {
  createLesson,
  updateLesson,
  deleteLesson,
  getAllUserLessons,
} = require("../../controllers/chat/lesson");

router.post("/create-lesson", protect, createLesson);
router.put("/update-lesson/:lessonId", protect, updateLesson);
router.delete("/delete-lesson/:lessonId", protect, deleteLesson);
router.post("/get-all-user-lessons", protect, getAllUserLessons);

module.exports = router;
