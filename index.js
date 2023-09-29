"use strict";
require("dotenv").config();
let port = process.env.PORT || 3001;
const server = require("./src/server");
const { db } = require("./src/models/index");

db.sync({
  // force: true,
}).then(() => {
  server.start(port);
});
