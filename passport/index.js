const passport = require("passport");
const local = require("./local");
const { User } = require("../models");

module.exports = () => {
  // 메모리에 세션(id: cookie-secret)을 저장한다.
  // 아마 req.login에서 실행이 되는 것 같다.
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  //  Q. 아래의 코드는 언제 실행?
  // 메모리에 저장된 세션(id: cookie-secret)과 비교해서 사용자 정보를 찾아서 done 호출
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({ where: { id } });
      done(null, user);
    } catch (error) {
      console.error(error);
      done(error);
    }
  });

  local();
};
