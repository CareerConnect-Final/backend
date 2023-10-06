"use strict";

const postsModel = (sequelize, DataTypes) =>
  sequelize.define("posts", {
    user_id: { type: DataTypes.INTEGER, required: true },
    content: { type: DataTypes.STRING },
    photo: { type: DataTypes.TEXT },
    username:{type:DataTypes.STRING},
    profilePicture:{type:DataTypes.TEXT},
    status: {
      type: DataTypes.ENUM("public", "private"),
      required: false,
      defaultValue: "public",
    },

   
  });

module.exports = postsModel;
