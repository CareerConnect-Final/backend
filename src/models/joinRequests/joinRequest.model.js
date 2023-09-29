"use strict";
//-------------------------------------------------------------------------------- join requests table aljamal
const joinRequests = (sequelize, DataTypes) =>
  sequelize.define("joinRequests ", {
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: { type: DataTypes.STRING },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "declined"),
      required: true,
      defaultValue: "pending",
    },
    employee_code: { type: DataTypes.STRING },
    message: { type: DataTypes.STRING },
  });

module.exports = joinRequests;
//-------------------------------------------------------------------------------- join requests table aljamal
