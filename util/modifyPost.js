const { pool } = require("../models");

const modifyPost = async (post) => {
  const connection = await pool.getConnection(async (conn) => conn);

  // 해당 게시글이 리트윗과 관련되어 있다면..
  if (post.retweet_id) {
    // 리트윗 게시글 불러오기
    const [retweetedPostArr] = await connection.query(
      "SELECT * FROM post WHERE id = ?",
      post.retweet_id
    );
    const retweetedPost = retweetedPostArr[0];

    // 해당 게시글 작성자 정보 불러오기
    const [userArr] = await connection.query(
      "SELECT id, nickname, profile_image_url FROM user WHERE id = ?",
      retweetedPost.user_id
    );
    const user = userArr[0];

    // 해당 게시글 좋아요한 사용자 불러오기
    const [likerArr] = await connection.query(
      "SELECT user_id AS id FROM react_nodebird.like WHERE post_id = ?",
      retweetedPost.id
    );

    // 삽입한 이미지 불러오기
    const [imageArr] = await connection.query(
      "SELECT src FROM image WHERE post_id=?",
      retweetedPost.id
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
      retweetedPost.id
    );
    const newComments = commentArr.map((c) => {
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

    // 리트윗한 사람의 정보 가져오기
    const [retweeterArr] = await connection.query(
      "SELECT id, nickname, profile_image_url FROM user WHERE id=?",
      post.user_id
    );
    const retweeter = retweeterArr[0];

    connection.release();

    const fullPost = {
      id: post.id,
      content: retweetedPost.content,
      created_at: retweetedPost.created_at,
      User: user,
      Likers: likerArr,
      Images: imageArr,
      Comments: newComments,
      Retweeter: retweeter,
    };

    return fullPost;
  } else {
    // 해당 게시글 작성자 정보 불러오기
    const [userArr] = await connection.query(
      "SELECT id, nickname, profile_image_url FROM user WHERE id = ?",
      post.user_id
    );
    const user = userArr[0];

    // 해당 게시글 좋아요한 사용자 불러오기
    const [likerArr] = await connection.query(
      "SELECT user_id AS id FROM react_nodebird.like WHERE post_id = ?",
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
    const newComments = commentArr.map((c) => {
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

    const fullPost = {
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      User: user,
      Likers: likerArr,
      Images: imageArr,
      Comments: newComments,
      Retweeter: null,
    };

    return fullPost;
  }
};

module.exports = modifyPost;
