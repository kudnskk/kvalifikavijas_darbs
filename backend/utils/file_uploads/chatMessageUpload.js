const multer = require("multer");

const storage = multer.memoryStorage();

const allowedTypes = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const fileFilter = (req, file, cb) => {
  if (allowedTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname), false);
};

const maxBytes = Number(process.env.CHAT_FILE_MAX_BYTES) || 512 * 1024; //512kb

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxBytes,
    files: 1,
  },
});

module.exports = upload;
