const friendsModel = (sequelize, DataTypes) => {
  return sequelize.define("Friends", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    friend_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    profilePicture:{type:DataTypes.TEXT},
  });
};

module.exports = friendsModel;
