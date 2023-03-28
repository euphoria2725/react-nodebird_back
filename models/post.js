const DataTypes = require("sequelize");
const { Model } = DataTypes;

module.exports = class Post extends Model {
  static init(sequelize) {
    return super.init(
      {
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        modelName: "Post",
        tableName: "posts",
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
        sequelize,
      }
    );
  }
  static associate(db) {
    db.Post.belongsTo(db.User);
    db.Post.belongsToMany(db.User, {
      through: "Like", // 어떤 테이블을 거칠 것인가?
      as: "Likers", // 나의 id를 이용해서 반대의 정보를 다루고 싶을 때, 방법의 이름을 어떻게 정할 것인가?
    });
    db.Post.hasMany(db.Comment);
    db.Post.hasMany(db.Image);
    db.Post.belongsToMany(db.Hashtag, { through: "PostHashtag" });
    db.Post.belongsTo(db.Post, { as: "Retweet" });
  }
};
