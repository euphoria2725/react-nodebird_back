const { faker } = require("@faker-js/faker");
const shortId = require("shortid");

const express = require("express");

const router = express.Router();

// loadPost API
router.get("/", (req, res) => {
  const posts = new Array(10).fill().map((v) => ({
    id: shortId.generate(),
    content: faker.lorem.paragraph(),
    User: {
      id: shortId.generate(),
      nickname: faker.name.firstName(),
      profileImageUrl: faker.image.avatar(),
    },
    Images: new Array(3).fill().map((v) => ({ src: faker.image.image() })),
    Comments: new Array(2).fill().map((v) => {
      return {
        id: shortId.generate(),
        content: faker.lorem.paragraph(),
        User: {
          id: shortId.generate(),
          nickname: faker.name.firstName(),
          profileImageUrl: faker.image.avatar(),
        },
      };
    }),
  }));
  res.json(posts);
});

// addPost API
router.post("/", (req, res) => {
  const data = req.body;
  const post = {
    id: shortId.generate(),
    content: data.text,
    User: data.User,
    Images: [],
    Comments: [],
  };
  res.json(post);
});

module.exports = router;
