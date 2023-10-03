"use strict";
//-------------------------------------------------------------------------------- friend requests table mohannad
const friendRequests = (sequelize, DataTypes) => {
  const model = sequelize.define("friendRequests ", {
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: { type: DataTypes.STRING },
    profilePicture:{type:DataTypes.STRING},
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "declined"),
      required: true,
      defaultValue: "pending",
    },
    message: { type: DataTypes.STRING },
  });

  return model;
};

module.exports = { friendRequestsModel: friendRequests };
//-------------------------------------------------------------------------------- friend requests table mohannad
