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
        },
        password: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        profileImageUrl: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        modelName: "User",
        tableName: "users",
        charset: "utf8",
        collate: "utf8_general_ci",
        sequelize,
      }
    );
  }
  static associate(db) {
    db.User.hasMany(db.Post);
    db.User.hasMany(db.Comment);
    // 서로 다른 테이블과 m:n
    db.User.belongsToMany(db.Post, {
      through: "Like",
      as: "Liked",
    });
    // 자기 참조 m:n
    db.User.belongsToMany(db.User, {
      through: "Follow",
      foreignKey: "FollowingId",
      as: "Followers",
    });
    db.User.belongsToMany(db.User, {
      through: "Follow",
      foreignKey: "FollowerId",
      as: "Followings",
    });
  }
};
