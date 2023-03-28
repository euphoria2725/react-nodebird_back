const { faker } = require("@faker-js/faker");
const shortId = require("shortid");

const express = require("express");

const router = express.Router();

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
