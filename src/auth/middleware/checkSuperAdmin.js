"use strict";

const checkSuperAdmin = async (req, res, next) => {
  try {
    if (req.user.role === "superadmin") {
      next();
    } else {
      next("Access Denied");
    }
  } catch (e) {
    next(e.message);
  }
};

module.exports = checkSuperAdmin;
