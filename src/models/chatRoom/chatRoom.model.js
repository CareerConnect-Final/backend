"use strict";
const chatRoom = (sequelize, DataTypes) =>
  sequelize.define("chatRoom", {
    room: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roomType: {
      type: DataTypes.ENUM("general", "announcements"),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

module.exports = chatRoom;
