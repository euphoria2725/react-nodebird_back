const bcrypt = require("bcrypt");
const express = require("express");
const passport = require("passport");
const multer = require("multer");
const path = require("path");

const { User, Post } = require("../models");
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
- logIn API
- logOut API
- signUp API
- loadUser API
*/

/** uploadProfileImage API */
router.post("/image", profileImageUpload.single("image"), (req, res, next) => {
  console.log(req.file);
  res.json(req.file);
});

/** logIn API, POST /user/login */
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
      const fullUserWithoutPassword = await User.findOne({
        where: { id: user.id },
        attributes: {
          exclude: ["password"],
        },
        include: [
          {
            model: Post,
            attributes: ["id"],
          },
          {
            model: User,
            as: "Followings",
            attributes: ["id"],
          },
          {
            model: User,
            as: "Followers",
            attributes: ["id"],
          },
        ],
      });
      return res.status(200).json(fullUserWithoutPassword);
    });
  })(req, res, next);
});

/** logOut API, POST /user/logout */
router.post("/logout", isLoggedIn, (req, res, next) => {
  req.logout(() => {
    req.session.destroy();
    res.send("ok");
  });
});

/** signUp(회원가입) API, POST /user */
router.post("/", isNotLoggedIn, async (req, res, next) => {
  try {
    // 이메일 중복 여부 확인
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (exUser) {
      return res.status(403).send("이미 사용 중인 이메일입니다.");
    }

    // 비밀번호 암호화 후 회원 생성
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPassword,
      profileImageUrl: req.body.profileImageUrl,
    });

    // 최종 응답
    res.status(201).send("ok");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/** loadUser API, GET /user */
router.get("/", async (req, res, next) => {
  try {
    if (req.user) {
      const fullUserWithoutPassword = await User.findOne({
        where: { id: req.user.id },
        attributes: {
          exclude: ["password"],
        },
        include: [
          {
            model: Post,
            attributes: ["id"],
          },
          {
            model: User,
            as: "Followings",
            attributes: ["id"],
          },
          {
            model: User,
            as: "Followers",
            attributes: ["id"],
          },
        ],
      });
      res.status(200).json(fullUserWithoutPassword);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
