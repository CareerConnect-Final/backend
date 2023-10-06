"use strict";
//-------------------------------------------------------------------------------- applyJob table aljamal
const reelsModel = (sequelize, DataTypes) =>
  sequelize.define("reels", {
    user_id: { type: DataTypes.INTEGER, required: true },
    content: { type: DataTypes.STRING },
    video: { type: DataTypes.TEXT },
    username:{type:DataTypes.STRING},
    profilePicture:{type:DataTypes.TEXT},
    status: {
      type: DataTypes.ENUM("public", "private"),
      required: false,
      defaultValue: "public",
    },

   
  });

module.exports = reelsModel;

//-------------------------------------------------------------------------------- applyJob table aljamal
