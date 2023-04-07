const express = require("express");
const passport = require("passport");

const { pool } = require("../models/index");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares/index");

const router = express.Router();

/*
API 목록
- logIn API
- logOut API
*/

/** logIn API, POST /auth/login */
router.post("/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      return res.status(401).send(info.reason);
    }
    return req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }

      const connection = await pool.getConnection(async (conn) => conn);

      // 사용자가 작성한 글 목록
      const [posts] = await connection.query(
        "SELECT id FROM post WHERE user_id=?",
        user.id
      );

      // 사용자가 팔로잉한 유저들
      const [followings] = await connection.query(
        "SELECT followed_id AS id, user.nickname FROM follow LEFT JOIN user ON followed_id=user.id WHERE following_id=?",
        user.id
      );

      // 사용자를 팔로우한 유저들
      const [followers] = await connection.query(
        "SELECT following_id AS id, user.nickname FROM follow LEFT JOIN user ON following_id=user.id WHERE followed_id=?",
        user.id
      );

      const fullUserWithoutPassword = {
        // 사용자 정보
        id: user.id,
        nickname: user.nickname,
        profile_image_url: user.profile_image_url,
        // 사용자가 작성한 게시글들
        Posts: posts,
        // 사용자가 팔로우한 사람들
        Followings: followings,
        // 사용자를 팔로우한 사람들
        Followers: followers,
      };

      connection.release();

      // user에 사용자 정보 있음.
      return res.status(200).json(fullUserWithoutPassword);
    });
  })(req, res, next);
});

/** logOut API, POST /auth/logout */
router.post("/logout", isLoggedIn, (req, res, next) => {
  req.logout(() => {
    req.session.destroy();
    res.send("ok");
  });
});

module.exports = router;
