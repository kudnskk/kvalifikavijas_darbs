const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/authProtect");
const {
  createActivity,
  getActivitiesByLessonId,
  getActivityById,
  submitActivityAttempt,
} = require("../../controllers/activities/activity");

router.post("/create-activity", protect, createActivity);
router.get("/get-by-lesson/:lessonId", protect, getActivitiesByLessonId);
router.get("/get/:activityId", protect, getActivityById);
router.post("/submit-attempt/:activityId", protect, submitActivityAttempt);

module.exports = router;
