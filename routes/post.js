const express = require("express");

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

// addComment API, POST /post/1/comment
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

module.exports = router;
