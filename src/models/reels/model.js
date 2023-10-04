"use strict";
//-------------------------------------------------------------------------------- applyJob table aljamal
const reelsModel = (sequelize, DataTypes) =>
  sequelize.define("reels", {
    user_id: { type: DataTypes.INTEGER, required: true },
    content: { type: DataTypes.STRING },
    video: { type: DataTypes.STRING },
    username:{type:DataTypes.STRING},
    profilePicture:{type:DataTypes.STRING},
    status: {
      type: DataTypes.ENUM("public", "private"),
      required: false,
      defaultValue: "public",
    },

   
  });

module.exports = reelsModel;

//-------------------------------------------------------------------------------- applyJob table aljamal
