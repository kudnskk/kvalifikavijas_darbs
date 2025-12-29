const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const { adminOnly } = require("../../middleware/adminProtect");
const {
  getDashboardStats,
  getMe,
  deleteMe,
  adminListUsers,
  adminBlockUser,
  adminDeleteUser,
} = require("../../controllers/users/user");

module.exports = router;
router.get("/stats", protect, getDashboardStats);
router.get("/me", protect, getMe);
router.delete("/me", protect, deleteMe);

router.get("/admin/users", protect, adminOnly, adminListUsers);
router.patch("/admin/users/:userId/block", protect, adminOnly, adminBlockUser);
router.delete("/admin/users/:userId", protect, adminOnly, adminDeleteUser);
