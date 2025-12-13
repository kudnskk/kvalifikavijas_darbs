const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const {
  getAllCategoriesAndLessons,
  createCategory,
} = require("../../controllers/chat/category");

router.get(
  "/get-all-categories-and-lessons",
  protect,
  getAllCategoriesAndLessons,
);
router.post("/create-category", protect, createCategory);

module.exports = router;
