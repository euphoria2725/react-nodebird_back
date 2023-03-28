const { faker } = require("@faker-js/faker");
const shortId = require("shortid");
const { User, Post } = require("../models");
const bcrypt = require("bcrypt");

const express = require("express");

const router = express.Router();

// logIn API
router.post("/login", async (req, res, next) => {
  try {
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      },
      attributes: {
        exclude: ["password"],
      },
    });
    console.log(exUser);
    if (exUser) {
      const user = {
        ...exUser.dataValues,
        Posts: [],
        Followings: new Array(3)
          .fill()
          .map((v) => ({ nickname: faker.name.firstName() })),
        Followers: new Array(4)
          .fill()
          .map((v) => ({ nickname: faker.name.firstName() })),
      };
      res.json(user);
    } else {
    }
  } catch (err) {
    console.error(err);
    next(error);
  }
});

/** signUp API, POST /user */
router.post("/", async (req, res, next) => {
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
      profileImageUrl: faker.image.avatar(), // 추후에 프로필 이미지 업로드 구현하기
    });

    // 최종 응답
    res.status(201).send("ok");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
