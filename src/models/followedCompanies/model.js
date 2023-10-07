"use strict";
//-------------------------------------------------------------------------------- followers requests table aljamal

const followed = (sequelize, DataTypes) =>
  sequelize.define("followedcompanies", {
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

module.exports = followed;
