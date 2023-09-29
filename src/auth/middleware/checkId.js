"use strict";
const {
  posts,
  comments,
  jobcomments,
  userModel,
} = require("../../models/index");

module.exports = async (req, res, next) => {
  try {
    const modelId = await req.model.get(req.params.id);
    const modelUserId = modelId["dataValues"].user_id;
    const userId = req.user.dataValues.id;

    if (
      modelUserId === userId ||
      req.user.role === "superadmin" ||
      modelId["dataValues"].id === userId
    ) {
      next();
    } else {
      next("you don't have permission");
    }
  } catch (error) {
    next("not allowed");
  }
};
