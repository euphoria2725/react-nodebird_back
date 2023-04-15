const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const passportConfig = require("./passport");

const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const postRouter = require("./routes/post");
const hashtagRouter = require("./routes/hashtag");

try {
  fs.accessSync("uploads");
} catch (error) {
  console.log("uploads 폴더가 없으므로 생성합니다.");
  fs.mkdirSync("uploads");
}

dotenv.config();
passportConfig();

const app = express();
const port = 3000;

app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:3061", // front 서버의 주소
    credentials: true,
  })
);
app.use("/", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: process.env.COOKIE_SECRET,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/hashtags", hashtagRouter);

app.listen(port, () => {
  console.log(`Twitter back-end server is now running on port ${port}`);
});
