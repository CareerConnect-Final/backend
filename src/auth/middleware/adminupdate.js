const {
  posts,
  comments,
  jobcomments,
  userModel,
} = require("../../models/index");

module.exports = async (req, res, next) => {
  try {
    const model = await req.model.get(req.params.id);
    const modelUserId = model["dataValues"].user_id;
    const userId = req.user.dataValues.id;
    if (modelUserId === userId || model["dataValues"].id === userId) {
      next();
    } else {
      next("you don't have permission");
    }
  } catch (error) {
    next("not allowed");
  }
};
