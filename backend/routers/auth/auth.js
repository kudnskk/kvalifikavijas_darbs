const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const { login, register, verifyUser } = require("../../controllers/auth/auth");

module.exports = router;

router.post("/login", login);
router.post("/register", register);
router.get("/verify", protect, verifyUser);
module.exports = router;
