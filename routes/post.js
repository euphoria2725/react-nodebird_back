const express = require("express");
const multer = require("multer");
const path = require("path");

const { pool } = require("../models/index");
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

const makePost = async (post) => {
  const connection = await pool.getConnection(async (conn) => conn);

  // 해당 게시글 작성자 정보 불러오기
  const [userArr] = await connection.query(
    "SELECT id, nickname, profile_image_url FROM user WHERE id = ?",
    post.user_id
  );
  const user = userArr[0];

  // 해당 게시글 좋아요한 사용자 불러오기
  const [likerArr] = await connection.query(
    "SELECT user_id AS id FROM react_nodebird.like WHERE post_id = ?", // 왜 위 코드는 잘 동작하고 이 코드는 동작을 안 하지?
    post.id
  );

  // 삽입한 이미지 불러오기
  const [imageArr] = await connection.query(
    "SELECT src FROM image WHERE post_id=?",
    post.id
  );

  connection.release();

  const res = {
    id: post.id,
    content: post.content,
    User: user,
    Likers: likerArr,
    Images: imageArr,
  };

  return res;
};

/*
API 목록
- uploadPostImages API
- addPost API
- loadPosts API
- addComment API
- likePost API
*/

// uploadPostImages API, POST /posts/images
router.post("/images", postImagesUpload.array("image"), (req, res, next) => {
  console.log(req.files);
  res.json(req.files.map((v) => v.filename));
});

// addPost API, POST /posts
router.post(
  "/",
  isLoggedIn,
  postImagesUpload.none(),
  async (req, res, next) => {
    try {
      const connection = await pool.getConnection(async (conn) => conn);

      // 게시글 DB에 넣기
      const [newPostInfo] = await connection.query(
        "INSERT INTO post(content, user_id) VALUES(?, ?)",
        [req.body.content, req.user.id]
      );

      // 이미지들 DB에 넣기
      if (req.body.image) {
        if (Array.isArray(req.body.image)) {
          await Promise.all(
            req.body.image.map(async (image) => {
              return await connection.query(
                "INSERT INTO image(src, post_id) VALUES(?, ?)",
                [image, newPostInfo.insertId]
              );
            })
          );
        } else {
          await connection.query(
            "INSERT INTO image(src, post_id) VALUES(?, ?)",
            [req.body.image, newPostInfo.insertId]
          );
        }
      }

      // 새로 작성된 게시글 찾기
      const [postArr] = await connection.query(
        "SELECT * FROM post WHERE id = ?",
        newPostInfo.insertId
      );
      const newPost = postArr[0];

      // 해당 게시글 작성자 정보 불러오기
      const [userArr] = await connection.query(
        "SELECT id, nickname, profile_image_url FROM user WHERE id = ?",
        newPost.user_id
      );
      const user = userArr[0];

      // 해당 게시글 좋아요한 사용자 불러오기
      const [likerArr] = await connection.query(
        "SELECT user_id AS id FROM react_nodebird.like WHERE post_id=?",
        newPost.id
      );

      // 삽입한 이미지 불러오기
      const [imageArr] = await connection.query(
        "SELECT src FROM image WHERE post_id=?",
        newPost.id
      );

      const fullPost = {
        id: newPost.id,
        content: newPost.content,
        User: user,
        Likers: likerArr,
        Images: imageArr,
      };

      connection.release();

      res.status(201).json(fullPost);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

// loadPosts API, GET /posts
router.get("/", async (req, res, next) => {
  try {
    const connection = await pool.getConnection(async (conn) => conn);

    const [postArr] = await connection.query(
      "SELECT * FROM post ORDER BY created_at DESC"
    );

    const newPostArr = await Promise.all(postArr.map(makePost));

    connection.release();

    res.json(newPostArr);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// addComment API, POST /posts/1/comment
// router.post("/:postId/comment", isLoggedIn, async (req, res) => {
//   try {
//     // 해당 게시글 존재 여부 확인
//     const post = await Post.findOne({
//       where: { id: req.params.postId },
//     });
//     if (!post) {
//       return res.status(403).send("존재하지 않는 게시글입니다.");
//     }
//     // 게시글이 있다면..
//     const comment = await Comment.create({
//       content: req.body.content,
//       PostId: parseInt(req.body.postId, 10),
//       UserId: req.user.id,
//     });
//     const fullComment = await Comment.findOne({
//       where: { id: comment.id },
//       include: [
//         { model: User, attributes: ["id", "nickname", "profileImageUrl"] },
//       ],
//     });
//     res.status(201).json(fullComment);
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

// likePost API, POST /posts/:postId/like
router.post("/:postId/like", isLoggedIn, async (req, res, next) => {
  try {
    const connection = await pool.getConnection(async (conn) => conn);

    let { postId } = req.params;
    postId = parseInt(postId, 10);

    await connection.query(
      "INSERT INTO react_nodebird.like(user_id, post_id) VALUES(?, ?)",
      [req.user.id, postId]
    );

    connection.release();

    res.json({
      user_id: req.user.id,
      post_id: postId,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
