const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const dotenv = require("dotenv");
const multer = require("multer");
const http = require("http");
const fs = require("fs");
const path = require("path");
dotenv.config();

const app = express();
const server = http.createServer(app);
//heasers security
app.use(cors());
app.use(helmet());
// Log requests
app.use((req, res, next) => {
  const contentType = req.headers["content-type"];
  console.log(
    `[${req.method}] ${req.originalUrl} - Content-Type: ${contentType}`,
  );
  next();
});
//parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// // Ensure uploads directory exists
// const uploadsDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// import routes
const auth = require("./routers/auth/auth");
const fileRouter = require("./routers/files/fileRouter");
const categoryRouter = require("./routers/chat/categoryRouter");
const lessonRouter = require("./routers/chat/lessonRouter");
// morgan routes view log
if (app.get("env") === "development") {
  app.use(morgan("tiny"));
  console.log("Morgan connected..");
}

// Database connection
const db = `${process.env.DB_STRING}`;
mongoose
  .connect(db)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Data base connection error:", err.message));

// use routes
app.use("/api/auth", auth); // Public route (login) and protected route (verify)
app.use("/api/files", fileRouter); // Protected routes - file upload/management
app.use("/api/categories", categoryRouter); // Protected routes - categories and lessons
app.use("/api/lessons", lessonRouter); // Protected routes - lesson management

// server welcome response
app.get("/", (req, res) => {
  return res.status(200).json({
    status: true,
    message: `Welcome to server side`,
  });
});

// multer error handler
// Proper multer error handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File is too large",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "File limit reached",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message:
          "Invalid file type. Only PDF, TXT, DOC, and DOCX files are allowed.",
      });
    }
  }

  // Generic error fallback
  return res.status(500).json({
    message: "Something went wrong",
    error: error.message,
  });
});

// server listening
const port = process.env.PORT || 5100;
server.listen(port, () => console.log(`Server is listening on port : ${port}`));
