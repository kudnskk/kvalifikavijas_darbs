const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const { createLesson } = require("../../controllers/chat/lesson");

router.post("/create-lesson", protect, createLesson);

module.exports = router;
