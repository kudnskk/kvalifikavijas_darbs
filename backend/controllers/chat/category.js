const User = require("../../models/users/user");
const Category = require("../../models/chat/category");
const Lesson = require("../../models/chat/lesson");
const Message = require("../../models/chat/message");
const Activity = require("../../models/activities/activity");
const ActivityQuestion = require("../../models/activities/activity_question");
const ActivityAnswer = require("../../models/activities/activity_answer");
const ActivityAttempt = require("../../models/attempt/activity_attempt");
const ActivityAttemptAnswer = require("../../models/attempt/activity_attempt_answer");

const COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Green", value: "#10B981" },
];
const ICONS = [
  { name: "FaBook" },
  { name: "FaLaptopCode" },
  { name: "FaCalculator" },
  { name: "FaBrain" },
];

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
        message: "Not all required input fields are filled in!",
      });
    }

    const categoryExists = await Category.findOne({
      title: title.trim(),
      user_id: userId,
    });

    if (categoryExists) {
      return res.status(400).json({
        status: false,
        message: "Category with this name alredy exists in the data base!",
      });
    }

    if (
      (color && !COLORS.map((c) => c.value).includes(color)) ||
      (icon && !ICONS.map((i) => i.name).includes(icon))
    ) {
      return res.status(400).json({
        status: false,

        message: "This category icon or color does not exist in the data base!",
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

const updateCategory = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { categoryId } = req.params;
    const { title, description, color, icon, addedLessons, removedLessons } =
      req.body;

    const category = await Category.findOne({ _id: categoryId });
    if (!category) {
      return res.status(404).json({
        status: false,

        message: "Selected catecory does not exist!",
      });
    }

    if (String(category.user_id) !== String(userId)) {
      return res.status(403).json({
        status: false,

        message: "This category does not belong to you!",
      });
    }

    if (!title) {
      return res.status(400).json({
        status: false,
        message: "Not all required input fields are filled in!",
      });
    }

    const categoryExists = await Category.findOne({
      user_id: userId,
      title: title,
      _id: { $ne: categoryId },
    });
    if (categoryExists) {
      return res.status(400).json({
        status: false,
        message: "Category with this name alredy exists in the data base!",
      });
    }

    if (
      (color && !COLORS.map((c) => c.value).includes(color)) ||
      (icon && !ICONS.map((i) => i.name).includes(icon))
    ) {
      return res.status(400).json({
        status: false,
        message: "This category icon or color does not exist in the data base!",
      });
    }

    const idsToCheck = [...new Set([...addedLessons, ...removedLessons])];
    if (idsToCheck.length) {
      const existingLessons = await Lesson.find({
        _id: { $in: idsToCheck },
        user_id: userId,
      }).select("_id");

      if (existingLessons.length !== idsToCheck.length) {
        return res.status(400).json({
          status: false,
          message: "One or more of the lessons do not exist in the data base!",
        });
      }
    }

    let newLessons = (category.lessons || []).map((id) => String(id));
    const removeSet = new Set(removedLessons.map((id) => String(id)));
    newLessons = newLessons.filter((id) => !removeSet.has(id));

    const addSet = new Set(addedLessons.map((id) => String(id)));
    addSet.forEach((id) => {
      if (!newLessons.includes(id)) newLessons.push(id);
    });

    category.title = title;
    category.description =
      typeof description === "string" ? description.trim() : "";
    category.color = color || category.color || "#3B82F6";
    category.icon = icon || category.icon || "FaBook";
    category.lessons = newLessons;

    await category.save();
    //update lessons that were added or removed from category
    if (addedLessons.length) {
      await Lesson.updateMany(
        { _id: { $in: addedLessons }, user_id: userId },
        { $set: { category_id: category._id } },
      );
    }
    if (removedLessons.length) {
      await Lesson.updateMany(
        {
          _id: { $in: removedLessons },
          user_id: userId,
          category_id: category._id,
        },
        { $set: { category_id: null } },
      );
    }

    const updatedCategory = await Category.findOne({ _id: categoryId })
      .populate({
        path: "lessons",
      })
      .lean();

    return res.status(200).json({
      status: true,
      message: "Category updated successfully!",
      data: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { categoryId } = req.params;

    const category = await Category.findOne({ _id: categoryId });
    if (!category) {
      return res.status(404).json({
        status: false,
        message: "Selected catecory does not exist!",
      });
    }

    if (String(category.user_id) !== String(userId)) {
      return res.status(403).json({
        status: false,
        message: "This category does not belong to you!",
      });
    }

    const lessonDocs = await Lesson.find({
      user_id: userId,
      category_id: categoryId,
    })
      .select("_id")
      .lean();

    const lessonIds = lessonDocs.map((l) => l._id);

    if (lessonIds.length) {
      const activityDocs = await Activity.find({
        lesson_id: { $in: lessonIds },
      })
        .select("_id")
        .lean();

      const activityIds = activityDocs.map((a) => a._id);

      const questionDocs = activityIds.length
        ? await ActivityQuestion.find({ activity_id: { $in: activityIds } })
            .select("_id")
            .lean()
        : [];
      const questionIds = questionDocs.map((q) => q._id);

      const attemptDocs = activityIds.length
        ? await ActivityAttempt.find({ activity_id: { $in: activityIds } })
            .select("_id")
            .lean()
        : [];
      const attemptIds = attemptDocs.map((a) => a._id);

      if (attemptIds.length) {
        await ActivityAttemptAnswer.deleteMany({
          activity_attempt_id: { $in: attemptIds },
        });
        await ActivityAttempt.deleteMany({ _id: { $in: attemptIds } });
      }

      if (questionIds.length) {
        await ActivityAnswer.deleteMany({ question_id: { $in: questionIds } });
        await ActivityQuestion.deleteMany({ _id: { $in: questionIds } });
      }

      if (activityIds.length) {
        await Activity.deleteMany({ _id: { $in: activityIds } });
      }

      await Message.deleteMany({ lesson_id: { $in: lessonIds } });
      await Lesson.deleteMany({ _id: { $in: lessonIds } });
    }

    await Category.deleteOne({ _id: categoryId });

    return res.status(200).json({
      status: true,
      message: "Category deleted successfully! ",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCategoriesAndLessons,
  createCategory,
  updateCategory,
  deleteCategory,
};
