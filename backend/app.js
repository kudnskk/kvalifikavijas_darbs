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
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_lesson_room", (lessonId) => {
    socket.join(lessonId);
    console.log(`User ${socket.id} joined room ${lessonId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

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

// import routes
const auth = require("./routers/auth/auth");
const fileRouter = require("./routers/files/fileRouter");
const categoryRouter = require("./routers/chat/categoryRouter");
const lessonRouter = require("./routers/chat/lessonRouter");
const messageRouter = require("./routers/chat/messageRouter");
const activityRouter = require("./routers/activities/activityRouter");
const userRouter = require("./routers/users/userRouter");
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
app.use("/api/auth", auth);
app.use("/api/files", fileRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/lessons", lessonRouter);
app.use("/api/messages", messageRouter);
app.use("/api/activities", activityRouter);
app.use("/api/users", userRouter);

// server welcome response
app.get("/", (req, res) => {
  return res.status(200).json({
    status: true,
    message: `Welcome to server side`,
  });
});

// multer error handler

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "This file is too large!",
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
          "System accepts txt, pdf, word files. This file type is not allowed!",
      });
    }
  }

  return res.status(500).json({
    message: "Something went wrong",
    error: error.message,
  });
});

// server listening
const port = process.env.PORT || 5100;
server.listen(port, () => console.log(`Server is listening on port : ${port}`));
