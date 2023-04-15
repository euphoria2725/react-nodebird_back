const express = require("express");
const passport = require("passport");

const { pool } = require("../models/index");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares/index");

const router = express.Router();

const modifyPost = require("../util/modifyPost");

/*
API 목록
- loadHashtagPosts API
*/

/** loadHashtagPosts API, GET /hashtags/방탄소년단 */
router.get("/:hashtag", async (req, res, next) => {
  try {
    const connection = await pool.getConnection(async (conn) => conn);

    let { hashtag } = req.params;
    hashtag = decodeURIComponent(hashtag);

    const [postArr] = await connection.query(
      "SELECT post.id AS id, post.content AS content, post.user_id AS user_id, post.retweet_id AS retweet_id FROM post_hashtag " +
        "LEFT JOIN POST ON post.id=post_hashtag.post_id " +
        "LEFT JOIN hashtag ON hashtag.id=post_hashtag.hashtag_id WHERE name=? " +
        "ORDER BY post.created_at DESC",
      hashtag
    );
    const newPostArr = await Promise.all(postArr.map(modifyPost));

    connection.release();

    res.status(200).json(newPostArr);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
