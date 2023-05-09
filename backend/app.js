const path = require("path");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const multer = require("multer");
const mongoose = require("mongoose");

// const cors = require('cors');
const app = express();
// app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + "-" + file.originalname);
  },
});

// Validate file upload
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use((req, res, next) => {
  // res.setHeader('Access-Control-Allow-Origin', 'trannhatsang.com, nhatsang.site.com, myfrontendapp.com');
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
// app.use(bodyParser.urlencoded());

app.use(bodyParser.json()); // Application json
app.use(
  multer({
    storage: storage,
    fileFilter: fileFilter,
  }).single("image")
);
// Upload lần lượt nhiều file thì làm như thế nào ???

app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

// Middleware handler error!!!
app.use((error, req, res, next) => {
  console.log(error);

  const status = error.statusCode || 500;
  const message = error.message;

  const data = error.data;

  res.status(status).json({
    message: message,
    data: data,
  });
});

mongoose
  .connect("mongodb+srv://nhatsang0101:48nJ1AfSQzAeKHoC@cluster0.aup360f.mongodb.net/messages")
  .then((result) => {
    const server = app.listen(8080);

    const io = require("./socket.js").init(server);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => {
    console.log(err);
  });
