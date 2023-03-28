const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const db = require("./models");

const userRouter = require("./routes/user");
const postRouter = require("./routes/post");
const postsRouter = require("./routes/posts");

dotenv.config();

const app = express();
const port = 3000;

db.sequelize
  .sync({ force: false })
  .then(() => {
    console.log("db 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/user", userRouter);
app.use("/post", postRouter);
app.use("/posts", postsRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
