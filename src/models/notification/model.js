"use strict";
const NotificationsModel = (sequelize, DataTypes) =>
  sequelize.define("notifications", {
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username:{
      type:DataTypes.STRING
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action_type: {
      type: DataTypes.ENUM(
        "new_message",
        "friend_request",
        "post_like",
        "post_comment",
        "job_post_like",
        "job_post_comment"
      ),
      required: true,
    },
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
    // is_read: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: false,
    //   defaultValue: false,
    // },
  });
module.exports = NotificationsModel;
