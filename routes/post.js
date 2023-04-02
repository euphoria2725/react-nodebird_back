const express = require("express");

const { faker } = require("@faker-js/faker");
const shortId = require("shortid");

const router = express.Router();

const { Post, Image, Comment, User, Hashtag } = require("../models");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares/index");

// addPost API, POST /post
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.create({
      content: text,
      UserId: req.user.id,
    });
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [
        {
          model: Image,
        },
        {
          model: Comment,
          include: [
            {
              model: User, // 댓글 작성자
              attributes: ["id", "nickname", "profileImageUrl"],
            },
          ],
        },
        {
          model: User, // 게시글 작성자
          attributes: ["id", "nickname", "profileImageUrl"],
        },
        {
          model: User,
          as: "Likers",
          attributes: ["id"],
        },
      ],
    });
    res.status(201).json(fullPost);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// addComment API
router.post("/:postId/comment", (req, res) => {
  const data = req.body;
  const comment = {
    id: shortId.generate(),
    content: data.content,
    User: data.User,
    postId: data.postId,
  };
  console.log(comment);
  res.json(comment);
});

module.exports = router;
