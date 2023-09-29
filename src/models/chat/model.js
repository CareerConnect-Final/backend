"use strict";
//-------------------------------------------------------------------------------- chat table aljamal
const Chat = (sequelize, DataTypes) =>
  sequelize.define("chat ", {
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: { type: DataTypes.STRING, allowNull: false  },
    sender_name: { type: DataTypes.STRING, required: true},
  });

module.exports = Chat;
//-------------------------------------------------------------------------------- chat table aljamal
