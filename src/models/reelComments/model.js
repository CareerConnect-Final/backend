"use strict";

const reelCommentsModel = (sequelize, DataTypes) =>
  sequelize.define("reelcomments", {
    content: { type: DataTypes.STRING, required: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username:{type:DataTypes.STRING},
    profilePicture:{type:DataTypes.TEXT},
    reel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

module.exports = reelCommentsModel;
