const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authProtect");
const upload = require("../../utils/file_uploads/uploadConfig");
const {
  uploadFile,
  getFileContent,
  deleteFile,
} = require("../../controllers/files/fileController");
router.post("/upload", protect, upload.single("file"), uploadFile);
router.get("/:filename", protect, getFileContent);
router.delete("/:filename", protect, deleteFile);

module.exports = router;
