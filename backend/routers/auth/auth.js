const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const {
  login,verifyUser
} = require("../../controllers/auth/auth");
router.post("/login",  login);
router.get('/verify', protect, verifyUser);
module.exports = router;