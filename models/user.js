const DataTypes = require("sequelize");
const { Model } = DataTypes;

module.exports = class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        email: {
          type: DataTypes.STRING(30),
          allowNull: false,
          unique: true,
        },
        nickname: {
          type: DataTypes.STRING(30),
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        profile_image_url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: true,
        modelName: "User",
        tableName: "user",
        paranoid: true,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {
    // 게시글 작성자
    db.User.hasMany(db.Post, {
      foreignKey: "user_id",
    });
    // follow
    db.User.belongsToMany(db.User, {
      through: "follow",
      as: "Followers",
      foreignKey: "followed_id",
    });
    db.User.belongsToMany(db.User, {
      through: "follow",
      as: "Followings",
      foreignKey: "following_id",
    });
    // 게시글 좋아요
    db.User.belongsToMany(db.Post, {
      through: "like",
      as: "Likes",
    });
  }
};
