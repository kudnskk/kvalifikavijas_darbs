const path = require("path");
const fs = require("fs").promises;

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    // Get user info from auth middleware (if protected)
    const userId = res.locals.user?.id;

    return res.status(200).json({
      status: true,
      message: "File uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: userId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "File upload failed",
      error: error.message,
    });
  }
};

exports.getFileContent = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join("uploads", filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        status: false,
        message: "File not found",
      });
    }

    // Read file content based on type
    const ext = path.extname(filename).toLowerCase();

    if (ext === ".txt") {
      const content = await fs.readFile(filePath, "utf-8");
      return res.status(200).json({
        status: true,
        data: {
          filename,
          content,
          type: "text",
        },
      });
    } else if (ext === ".pdf") {
      // For PDF, you might want to use a library like pdf-parse
      return res.status(200).json({
        status: true,
        message: "PDF processing not yet implemented",
        data: {
          filename,
          path: filePath,
        },
      });
    } else {
      return res.status(200).json({
        status: true,
        message:
          "File found but content extraction not supported for this type",
        data: {
          filename,
          path: filePath,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to read file",
      error: error.message,
    });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join("uploads", filename);

    await fs.unlink(filePath);

    return res.status(200).json({
      status: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to delete file",
      error: error.message,
    });
  }
};
