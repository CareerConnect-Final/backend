const Likes = (Sequelize, DataTypes) =>
  Sequelize.define("likes1", {
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
