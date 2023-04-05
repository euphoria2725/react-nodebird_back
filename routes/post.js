const express = require("express");
const multer = require("multer");
const path = require("path");
const { QueryTypes } = require("sequelize");

const { Post, Image, Comment, User, Hashtag, sequelize } = require("../models");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares/index");

const router = express.Router();

const postImagesUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, "uploads");
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      done(null, basename + "_" + new Date().getTime() + ext);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

/*
API 목록
- addPost API
- addComment API
- loadPosts API
- uploadPostImages API
*/

// addPost API, POST /posts
router.post(
  "/",
  isLoggedIn,
  postImagesUpload.none(),
  async (req, res, next) => {
    try {
      console.log("req.user.id", req.user.id);
      const post = await Post.create({
        content: req.body.content,
        user_id: req.user.id,
      });
      // if (req.body.image) {
      //   if (Array.isArray(req.body.image)) {
      //     const images = await Promise.all(
      //       req.body.image.map((image) =>
      //         Image.create({ src: image, post_id: post.id })
      //       )
      //     );
      //   } else {
      //     const image = await Image.create({ src: image, post_id: post.id });
      //   }
      // }
      const fullPost = await Post.findOne({
        where: { id: post.id },
        include: [
          {
            model: User,
            attributes: ["id", "nickname", "profile_image_url"],
          },
          { model: User, as: "Likers", attributes: ["id"] },
        ],
      });
      res.status(201).json(fullPost);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

// addComment API, POST /posts/1/comment
router.post("/:postId/comment", isLoggedIn, async (req, res) => {
  try {
    // 해당 게시글 존재 여부 확인
    const post = await Post.findOne({
      where: { id: req.params.postId },
    });
    if (!post) {
      return res.status(403).send("존재하지 않는 게시글입니다.");
    }
    // 게시글이 있다면..
    const comment = await Comment.create({
      content: req.body.content,
      PostId: parseInt(req.body.postId, 10),
      UserId: req.user.id,
    });
    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [
        { model: User, attributes: ["id", "nickname", "profileImageUrl"] },
      ],
    });
    res.status(201).json(fullComment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// loadPosts API, GET /posts
router.get("/", async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "nickname", "profile_image_url"],
        },
        {
          model: User,
          as: "Likers",
          attributes: ["id", "nickname", "profile_image_url"],
        },
      ],
    });
    res.json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});
router.get("/", async (req, res, next) => {
  try {
    const post = await sequelize.query("");
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// uploadPostImages API, POST /posts/images
router.post("/images", postImagesUpload.array("image"), (req, res, next) => {
  console.log(req.files);
  res.json(req.files.map((v) => v.filename));
});

module.exports = router;
