'use strict'
// const {userModel} = require("../../auth/models/users");
const {userModel} = require("../../models/index");

const bearerAuth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw new Error("Invalid Login");
    }

    const token = req.headers.authorization.split(" ").pop();
    const validUser = await userModel.authenticateToken(token);

    if (!validUser || validUser.isTokenBlacklisted) {
      throw new Error("Invalid Login");
    }

    req.user = validUser;
    req.token = validUser.token;
    next();
  } catch (e) {
    next(e); 
  }
};

module.exports = bearerAuth;
