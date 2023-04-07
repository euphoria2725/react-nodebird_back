const passport = require("passport");
const local = require("./local");
const { pool } = require("../models/index");

module.exports = () => {
  passport.serializeUser((user, done) => {
    console.log("serializeUser 시작..!");
    done(null, user.id); // 서버쪽에 [{ id: 1, cookie: 'clhxy' }]
  });

  passport.deserializeUser(async (id, done) => {
    try {
      console.log("deserializeUser 시작..!");

      const connection = await pool.getConnection(async (conn) => conn);

      const [userArr] = await connection.query(
        "SELECT * FROM user WHERE id=?",
        id
      );
      const user = userArr[0];

      connection.release();

      done(null, user); // req.user
    } catch (error) {
      console.error(error);
      done(error);
    }
  });

  local();
};
