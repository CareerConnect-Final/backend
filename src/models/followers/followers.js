"use strict";
//-------------------------------------------------------------------------------- followers requests table aljamal

const followers = (sequelize, DataTypes) =>
  sequelize.define("followers", {
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    company_name: { type: DataTypes.STRING },
  });

module.exports = followers;

//-------------------------------------------------------------------------------- followers requests table aljamal
