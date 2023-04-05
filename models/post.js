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
        sequelize,
        timestamps: true,
        underscored: true,
        modelName: "Post",
        tableName: "post",
        paranoid: true,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(db) {
    // 게시글 작성자
    db.Post.belongsTo(db.User, {
      foreignKey: "user_id",
    });
    // 게시글 좋아요
    db.Post.belongsToMany(db.User, { through: "like", as: "Likers" });
  }
};
