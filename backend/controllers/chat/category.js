const User = require("../../models/users/user");
const Category = require("../../models/char/category");
const Lesson = require("../../models/char/lesson");
const getAllCategoriesAndLessons = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const categories = await Category.find({ user_id: userId }).lean();
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch categories and lessons",
      error: error.message,
    });
  }
};
