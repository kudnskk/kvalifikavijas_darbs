const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const {
  getAllCategoriesAndLessons,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../../controllers/chat/category");

router.get(
  "/get-all-categories-and-lessons",
  protect,
  getAllCategoriesAndLessons,
);
router.post("/create-category", protect, createCategory);
router.put("/update-category/:categoryId", protect, updateCategory);
router.delete("/delete-category/:categoryId", protect, deleteCategory);

module.exports = router;
