"use strict";
const NotificationsModel = (sequelize, DataTypes) =>
  sequelize.define("notifications", {
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
    },
    profilePicture: {
      type: DataTypes.STRING,
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action_type: {
      type: DataTypes.ENUM(
        "new_message",
        "friend_request",
        "post",
        "job_post",
        "job_postapp"
      ),
      required: true,
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // job_post_id: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    message: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_seen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // timestamp: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   defaultValue: DataTypes.NOW,
    // },
  });
module.exports = NotificationsModel;
