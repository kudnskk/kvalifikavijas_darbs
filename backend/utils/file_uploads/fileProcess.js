const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

  const allowedMimeTypes = ['application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("File type not supported"), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 5 },
});