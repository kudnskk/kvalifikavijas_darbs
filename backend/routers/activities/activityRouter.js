const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/authProtect");
const {
  createActivity,
  getActivitiesByLessonId,
} = require("../../controllers/activities/activity");

router.post("/create-activity", protect, createActivity);
router.get("/get-by-lesson/:lessonId", protect, getActivitiesByLessonId);

module.exports = router;
