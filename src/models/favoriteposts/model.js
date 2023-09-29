"use strict";

const favoritesModel = (sequelize, DataTypes) =>
  sequelize.define("favorites", {
    user_id: { type: DataTypes.INTEGER, required: true },
    post_id: { type: DataTypes.INTEGER, required: true },
  });

module.exports = favoritesModel;
