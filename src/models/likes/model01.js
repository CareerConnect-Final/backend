const Likes = (Sequelize, DataTypes) =>
  Sequelize.define("joblikes", {
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: { type: DataTypes.STRING },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

module.exports = Likes;
