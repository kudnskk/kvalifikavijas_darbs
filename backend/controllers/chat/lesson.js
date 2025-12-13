const Lesson = require("../../models/chat/lesson");
const Category = require("../../models/chat/category");

const createLesson = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { title, category_id } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        status: false,
        message: "Lesson title is required",
      });
    }

    // If category_id is provided, verify it exists and belongs to the user
    if (category_id) {
      const category = await Category.findOne({
        _id: category_id,
        user_id: userId,
      });

      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Category not found or does not belong to user",
        });
      }
    }

    // Create new lesson
    const newLesson = new Lesson({
      title: title.trim(),
      category_id: category_id || null,
      user_id: userId,
      status: "not-started",
      texts: [],
    });

    await newLesson.save();

    // If category exists, add lesson to category's lessons array
    if (category_id) {
      await Category.findByIdAndUpdate(category_id, {
        $push: { lessons: newLesson._id },
      });
    }

    return res.status(201).json({
      status: true,
      message: "Lesson created successfully",
      data: newLesson,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to create lesson",
      error: error.message,
    });
  }
};

module.exports = {
  createLesson,
};
