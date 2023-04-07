const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const bcrypt = require("bcrypt");
const { pool } = require("../models/index");

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const connection = await pool.getConnection(async (conn) => conn);

          // 해당 email을 가진 사용자 조회
          const [userArr] = await connection.query(
            "SELECT * FROM user WHERE email=?",
            email
          );
          const user = userArr[0];
          console.log("user", user);

          connection.release();

          // 해당 eamil을 가진 사용자가 없다면 error 처리
          if (!user) {
            return done(null, false, { reason: "존재하지 않는 이메일입니다." });
          }

          // 비밀번호 일치 여부 확인
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          }
          return done(null, false, { reason: "비밀번호가 틀렸습니다." });
        } catch (error) {
          console.error(error);
          return done(error);
        }
      }
    )
  );
};
