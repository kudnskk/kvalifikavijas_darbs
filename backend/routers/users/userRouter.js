const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const { adminOnly } = require("../../middleware/adminProtect");
const {
  getDashboardStats,
  getMe,
  deleteMe,
  adminListUsers,
  adminChangeUserStatus,
  adminDeleteUser,
} = require("../../controllers/users/user");

module.exports = router;
router.get("/stats", protect, getDashboardStats);
router.get("/me", protect, getMe);
router.delete("/me", protect, deleteMe);

router.get("/admin/get-users", protect, adminOnly, adminListUsers);
router.patch(
  "/admin/users/change-status/:userId",
  protect,
  adminOnly,
  adminChangeUserStatus,
);
router.delete("/admin/users/:userId", protect, adminOnly, adminDeleteUser);
