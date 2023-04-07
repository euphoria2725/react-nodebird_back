const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const { pool } = require("../models/index");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares/index");

const router = express.Router();

const profileImageUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, "uploads");
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname); // 확장자 추출
      const basename = path.basename(file.originalname, ext); // 파일명 추출
      done(null, basename + "_" + new Date().getTime() + ext); // 파일명_1534783892.확장자
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

/*
API 목록
- uploadProfileImage API
- signUp API
- loadUser API
- follow API
- unfollow API
- removeFollower API
- changeNickname API
*/

/** uploadProfileImage API, POST /users/image  */
router.post("/image", profileImageUpload.single("image"), (req, res, next) => {
  console.log(req.file);
  res.json(req.file);
});

/** signUp(회원가입) API, POST /users */
router.post("/", isNotLoggedIn, async (req, res, next) => {
  try {
    const connection = await pool.getConnection(async (conn) => conn);

    const { email, nickname, password, profile_image_url } = req.body;

    // 이메일 중복 여부 확인
    // 이 때, 비밀번호까지 찾아와야지 비밀번호 비교 후, 로그인 여부 판단할 수 있다.
    const [userArr] = await connection.query(
      "SELECT * FROM user WHERE email=?",
      email
    );
    if (userArr.length > 0) {
      return res.status(403).send("이미 사용 중인 이메일입니다.");
    }

    // 비밀번호 암호화 후 회원 생성
    const hashedPassword = await bcrypt.hash(password, 12);
    await connection.query(
      "INSERT INTO user(email, nickname, password, profile_image_url) VALUES(?, ?, ?, ?)",
      [email, nickname, hashedPassword, profile_image_url]
    );

    connection.release();

    // 최종 응답
    res.status(201).send("ok");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/** loadUser API, GET /users */
router.get("/", async (req, res, next) => {
  try {
    if (req.user) {
      const connection = await pool.getConnection(async (conn) => conn);

      // 사용자 정보
      const [userArr] = await connection.query(
        "SELECT id, email, nickname, profile_image_url FROM user WHERE id=?",
        req.user.id
      );
      const user = userArr[0];

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
        ...user,
        Posts: posts,
        Followings: followings,
        Followers: followers,
      };

      connection.release();

      // user에 사용자 정보 있음.
      return res.status(200).json(fullUserWithoutPassword);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/** follow API, POST /users/:userId/follow */
router.post("/:userId/follow", isLoggedIn, async (req, res, next) => {
  try {
    let { userId } = req.params;
    userId = parseInt(userId, 10);

    const connection = await pool.getConnection(async (conn) => conn);

    await connection.query(
      "INSERT INTO follow(following_id, followed_id) VALUES (?, ?)",
      [req.user.id, userId]
    );

    connection.release();

    res.status(200).json({ id: userId });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/** unfollow API, DELETE /users/:userId/unfollow */
router.delete("/:userId/follow", isLoggedIn, async (req, res, next) => {
  try {
    let { userId } = req.params;
    userId = parseInt(userId, 10);

    const connection = await pool.getConnection(async (conn) => conn);

    await connection.query(
      "DELETE FROM follow WHERE following_id=? AND followed_id=?",
      [req.user.id, userId]
    );

    connection.release();

    res.status(200).json({ id: userId });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/** removeFollower API, DELETE /users/followers/:userId */
router.delete("/followers/:userId", isLoggedIn, async (req, res, next) => {
  try {
    let { userId } = req.params;
    userId = parseInt(userId, 10);

    const connection = await pool.getConnection(async (conn) => conn);

    await connection.query(
      "DELETE FROM follow WHERE following_id=? AND followed_id=?",
      [userId, req.user.id]
    );

    connection.release();

    res.status(200).json({ id: userId });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/** changeNickname API, DELETE /users/:userId/nickname */
router.patch("/:userId/nickname", isLoggedIn, async (req, res, next) => {
  try {
    const { nickname } = req.body;
    let { userId } = req.params;
    userId = parseInt(userId, 10);

    const connection = await pool.getConnection(async (conn) => conn);

    await connection.query("UPDATE user SET nickname=? WHERE id=?", [
      nickname,
      userId,
    ]);

    connection.release();

    res.status(200).json({ nickname });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
