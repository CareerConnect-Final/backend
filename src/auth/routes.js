"use strict";

const express = require("express");
const authRouter = express.Router();
const checkSuperAdmin = require("./middleware/checkSuperAdmin");
const { users } = require("../../src/models/index");
const basicAuth = require("./middleware/basic.js");
const bearerAuth = require("./middleware/bearer.js");
const permissions = require("./middleware/acl.js");
const { userModel } = require("../models/index");

authRouter.post("/signup", async (req, res, next) => {
  try {
    let userRecord = await users.create(req.body);
    const output = {
      userId: userRecord.id,
      userName: userRecord.username,
      role: userRecord.role,
    };
    res.status(201).json(output);
  } catch (e) {
    next(e.message);
  }
});

authRouter.post("/signin", basicAuth, (req, res, next) => {
  try {
    const user = {
      id: req.user.id,
      username: req.user.username,
      token: req.user.token,
      role: req.user.role,
    };
    res.status(200).json(req.user);
  } catch (e) {
    next(e.message);
  }
});
authRouter.get("/profile", bearerAuth, async (req, res, next) => {
  try {
    const user = {
      userName: req.user.username,
      id: req.user.id,
      token: req.user.token,
      myRole: req.user.role,
  };
  res.status(200).json(req.user);
  } catch (e) {
    next(e); // Pass the error to the next middleware/error handler
  }
});
authRouter.get(
  "/users",
  bearerAuth,
  checkSuperAdmin,
  async (req, res, next) => {
    const userRecords = await users.get();

    const list = userRecords.map((user) => user.username + " " + user.id);
    res.status(200).json(list);
  }
);

//------------------Logout-----------------

authRouter.post("/logout", bearerAuth, async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ").pop();
    const validUser = await userModel.authenticateToken(token);

    if (!validUser) {
      return next(new Error("Invalid user"));
    }

    validUser.isTokenBlacklisted = true;
    await validUser.save();

    res.status(200).json({ message: "Logout successful" });
  } catch (e) {
    next(e);
  }
});

module.exports = authRouter;
