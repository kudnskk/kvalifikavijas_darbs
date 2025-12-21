const User = require("../../models/users/user");
const Category = require("../../models/chat/category");
const Lesson = require("../../models/chat/lesson");

const getAllCategoriesAndLessons = async (req, res) => {
  try {
    const userId = res.locals.user.id;

    const categoriesData = await Category.find({ user_id: userId })
      .populate({
        path: "lessons",
        select: "title status createdAt updatedAt",
      })
      .lean();
    const categories = categoriesData.map((category) => ({
      ...category,
      lessonsCount: category.lessons.length,
    }));
    const lessons = await Lesson.find({ user_id: userId })
      .sort({
        updatedAt: -1,
      })
      .select("title status createdAt updatedAt")
      .populate("category_id", "title color")
      .lean();

    return res.status(200).json({
      status: true,
      message: "Categories and lessons fetched successfully",
      data: {
        categories,
        lessons,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch categories and lessons",
      error: error.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { title, description, color, icon } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: false,
        message: "Category title is required",
      });
    }

    const newCategory = new Category({
      title: title.trim(),
      description: description?.trim() || "",
      color: color || "#3B82F6",
      icon: icon || "FaBook",
      user_id: userId,
      lessons: [],
    });

    await newCategory.save();

    return res.status(201).json({
      status: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCategoriesAndLessons,
  createCategory,
};
