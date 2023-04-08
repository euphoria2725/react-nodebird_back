const express = require("express");
const multer = require("multer");
const path = require("path");

const { pool } = require("../models/index");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares/index");
const { REFUSED } = require("dns");

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

  // 해당 게시글에 작성된 댓글 불러오기
  const [commentArr] = await connection.query(
    `SELECT comment.id             AS id,
            comment.content        AS content,
            comment.created_at     AS created_at,
            user.id                AS user_id,
            user.nickname          AS user_nickname,
            user.profile_image_url AS user_profile_image_url
     FROM comment
              LEFT JOIN user
                        ON comment.user_id = user.id
     WHERE comment.post_id = ?
     ORDER BY comment.created_at DESC`,
    post.id
  );
  newComments = commentArr.map((c) => {
    return {
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      User: {
        id: c.user_id,
        nickname: c.user_nickname,
        profile_image_url: c.user_profile_image_url,
      },
    };
  });

  connection.release();

  const res = {
    id: post.id,
    content: post.content,
    User: user,
    Likers: likerArr,
    Images: imageArr,
    Comments: newComments,
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
- unlikePost API
- removePost API
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

      // 해시태그들 DB에 넣기 -> 배열의 순차 처리
      const hashtags = req.body.content.match(/#[^\s#]+/g);
      if (hashtags) {
        for (let tag of hashtags) {
          // console.log("start");

          // 일치하는 hashtag 찾기
          const [hashtagArr] = await connection.query(
            "SELECT * FROM hashtag WHERE name=?",
            tag.slice(1).toLowerCase()
          );

          if (hashtagArr.length === 0) {
            // 일치하는 hashtag가 없다면, DB에 넣기
            const [newHashtagInfo] = await connection.query(
              "INSERT INTO hashtag(name) VALUES(?)",
              tag.slice(1).toLowerCase()
            );

            // hashtag와 게시글 관계 mapping
            await connection.query(
              "INSERT INTO post_hashtag(post_id, hashtag_id) VALUES(?, ?)",
              [newPostInfo.insertId, newHashtagInfo.insertId]
            );
          } else {
            // 일치하는 hashtag가 있을 경우
            const hashtag = hashtagArr[0];

            // 사용자가 '#태그 #태그'처럼 mapping 중복 방지
            const [mappingArr] = await connection.query(
              "SELECT * from post_hashtag WHERE post_id=? AND hashtag_id=?",
              [newPostInfo.insertId, hashtag.id]
            );
            if (mappingArr.length === 0) {
              // hashtag와 게시글 관계 mapping
              await connection.query(
                "INSERT INTO post_hashtag(post_id, hashtag_id) VALUES(?, ?)",
                [newPostInfo.insertId, hashtag.id]
              );
            }
          }

          // console.log("end");
        }
      }

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
        Comments: [],
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

    let { lastId } = req.query;
    lastId = parseInt(lastId, 10);

    const limit = 5;

    if (lastId > 0) {
      const lastId = parseInt(req.query.lastId, 10);
      const [postArr] = await connection.query(
        `SELECT *
         FROM react_nodebird.post
         WHERE id < ?
         ORDER BY created_at DESC LIMIT ?`,
        [lastId, limit]
      );

      const newPostArr = await Promise.all(postArr.map(makePost));

      connection.release();

      res.status(200).json(newPostArr);
    } else {
      // lastId=0일 경우
      const [postArr] = await connection.query(
        `SELECT *
         FROM react_nodebird.post
         ORDER BY created_at DESC LIMIT ?`,
        limit
      );

      const newPostArr = await Promise.all(postArr.map(makePost));

      connection.release();

      res.status(200).json(newPostArr);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/** addComment API, POST /posts/1/comment */
router.post("/:postId/comment", isLoggedIn, async (req, res) => {
  try {
    const { content } = req.body;
    let { postId } = req.params;
    postId = parseInt(postId, 10);

    const connection = await pool.getConnection(async (conn) => conn);

    const [insertInfo] = await connection.query(
      "INSERT INTO comment(content, post_id, user_id) VALUES(?, ?, ?)",
      [content, postId, req.user.id]
    );

    const [commentArr] = await connection.query(
      "SELECT * FROM comment WHERE id=?",
      insertInfo.insertId
    );
    const newComment = commentArr[0];

    const [userArr] = await connection.query(
      "SELECT id, nickname, profile_image_url FROM user WHERE id=?",
      req.user.id
    );
    const user = userArr[0];

    const fullComment = {
      ...newComment,
      User: {
        id: user.id,
        nickname: user.nickname,
        profile_image_url: user.profile_image_url,
      },
    };

    connection.release();

    res.status(201).json(fullComment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/** likePost API, POST /posts/:postId/like */
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

/** unlikePost API, DELETE /posts/:postId/like */
router.delete("/:postId/like", isLoggedIn, async (req, res, next) => {
  try {
    const connection = await pool.getConnection(async (conn) => conn);

    let { postId } = req.params;
    postId = parseInt(postId, 10);

    await connection.query(
      "DELETE FROM react_nodebird.like WHERE user_id=? AND post_id=?",
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

/** removePost API, DELETE /posts/:postId */
router.delete("/:postId", isLoggedIn, async (req, res, next) => {
  try {
    const connection = await pool.getConnection(async (conn) => conn);

    let { postId } = req.params;
    postId = parseInt(postId, 10);

    await connection.query("DELETE FROM post WHERE id=? AND user_id", [
      postId,
      req.user.id,
    ]);

    connection.release();

    res.json({ id: postId });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
