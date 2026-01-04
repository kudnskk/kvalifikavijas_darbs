const Lesson = require("../../models/chat/lesson");
const Category = require("../../models/chat/category");
const Activity = require("../../models/activities/activity");
const ActivityAttempt = require("../../models/attempt/activity_attempt");
const ActivityQuestion = require("../../models/activities/activity_question");
const ActivityAnswer = require("../../models/activities/activity_answer");
const ActivityAttemptAnswer = require("../../models/attempt/activity_attempt_answer");
const Message = require("../../models/chat/message");
const User = require("../../models/users/user");
const bcrypt = require("bcrypt");

const deleteUserAndData = async (userId) => {
  const lessonDocs = await Lesson.find({ user_id: userId })
    .select("_id")
    .lean();
  const lessonIds = lessonDocs.map((l) => l._id);

  if (lessonIds.length) {
    const activityDocs = await Activity.find({ lesson_id: { $in: lessonIds } })
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

  await Category.deleteMany({ user_id: userId });
  await User.deleteOne({ _id: userId });
};

const getMe = async (req, res) => {
  try {
    const userId = res.locals.user.id;

    const user = await User.findById(userId)
      .select(
        "_id email user_name user_type is_blocked is_email_verified createdAt updatedAt",
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User does not exist!",
      });
    }

    return res.status(200).json({
      status: true,
      message: "User profile fetched successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          user_name: user.user_name,
          user_type: user.user_type,
          is_blocked: user.is_blocked,
          is_email_verified: user.is_email_verified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};

const deleteMe = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { password } = req.body || {};

    if (!password || !String(password).trim()) {
      return res.status(400).json({
        status: false,
        message: "Not all required input fields are filled in!",
      });
    }

    const user = await User.findById(userId).select("_id password");
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User does not exist!",
      });
    }

    const passwordMatch = await bcrypt.compare(
      String(password).trim(),
      user.password,
    );
    if (!passwordMatch) {
      return res.status(401).json({
        status: false,
        message:
          "The entered password is incorrect.(Ievadītā parole nav pareiza.)",
      });
    }

    await deleteUserAndData(userId);

    return res.status(200).json({
      status: true,
      message: "User deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

const adminListUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "_id email user_name user_type is_blocked is_email_verified createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No user found!",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Users fetched successfully",
      data: {
        users: users.map((u) => ({
          id: u._id,
          email: u.email,
          user_name: u.user_name,
          user_type: u.user_type,
          is_blocked: u.is_blocked,
          is_email_verified: u.is_email_verified,
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const adminChangeUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("_id is_blocked");
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User does not exist!",
      });
    }
    const isBlocked = user.is_blocked;

    user.is_blocked = !isBlocked;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "User status changed successfully! ",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to change user status",
      error: error.message,
    });
  }
};

const adminDeleteUser = async (req, res) => {
  try {
    const adminId = res.locals.user.id;
    const { userId } = req.params;

    if (String(adminId) === String(userId)) {
      return res.status(400).json({
        status: false,
        message:
          "Are you sure you want to permanently delete your account? (Vai jūs tiešām gribāt neatgriezeniski dzēst savu kontu?)",
      });
    }

    const user = await User.findById(userId).select("_id");
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User does not exist! (Lietotājs neeksistē!)",
      });
    }

    await deleteUserAndData(userId);

    return res.status(200).json({
      status: true,
      message: "User deleted successfully! (Lietotājs izdzēsts veiksmīgi!)",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = res.locals.user.id;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [categoryCount, lessonCount, inProgressUpdatedThisWeek] =
      await Promise.all([
        Category.countDocuments({ user_id: userId }),
        Lesson.countDocuments({ user_id: userId }),
        Lesson.countDocuments({
          user_id: userId,
          status: "in-progress",
          updatedAt: { $gte: weekAgo },
        }),
      ]);

    const lessonDocs = lessonCount
      ? await Lesson.find({ user_id: userId }).select("_id").lean()
      : [];
    const lessonIds = lessonDocs.map((l) => l._id);

    const activityDocs = lessonIds.length
      ? await Activity.find({ lesson_id: { $in: lessonIds } })
          .select("_id")
          .lean()
      : [];
    const activityIds = activityDocs.map((a) => a._id);

    const activityAttemptCount = activityIds.length
      ? await ActivityAttempt.countDocuments({
          activity_id: { $in: activityIds },
        })
      : 0;

    return res.status(200).json({
      status: true,
      message: "Dashboard stats fetched successfully",
      data: {
        categoryCount,
        lessonCount,
        activityAttemptCount,
        inProgressUpdatedThisWeek,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

module.exports = {
  getMe,
  deleteMe,
  getDashboardStats,
  getUserStats: getDashboardStats,
  adminListUsers,
  adminChangeUserStatus,
  adminDeleteUser,
};
