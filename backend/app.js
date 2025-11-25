const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const dotenv = require("dotenv");
const multer = require("multer");
const http = require("http");
dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Expose-Headers", "Content-Disposition");
  next();
});

app.use(cors());
app.use(helmet());
app.use((req, res, next) => {
  const contentType = req.headers['content-type'];
  console.log(`[${req.method}] ${req.originalUrl} - Content-Type: ${contentType}`);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
//const upload = multer({ dest: "uploads/" });

// app.post("/upload", upload.single("file"), (req, res) => {
//   console.log(req.file); // Your uploaded PDF
// });

// import routes
const pdf_text_replacer = require("./routers/pdf_text_replacer/pdf_text_replacer");
const auth = require("./routers/auth/auth");
// morgan routes view
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
app.use("/api/pdf", pdf_text_replacer);
app.use("/api/auth", auth);

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
        message: "File must be a PDF",
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
