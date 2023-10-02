"use strict";

require("dotenv").config();
const port = process.env.PORT || 3001;
const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./auth/routes");
const v2Routes = require("./routes/v2.js");
const v3Routes = require("./routes/v3.js");
const notFoundHandler = require("./error-handlers/404.js");
const errorHandler = require("./error-handlers/500.js");
const socketIo = require("socket.io");
/* ------------------------- handle recieved tocken from client , this to be removed later */
const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET || "secretstring";
const {
  notificationModel,
  user,
  employeesTable,
  chatRoomTable,
} = require("./models/index");

/* ----------------------------------------------------------------------------------------*/
// const logger = require("./middleware/logger.js");
const v1Routes = require("./routes/v1.js");
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: `http://localhost:${process.env.PORT}/`,
    methods: ["GET", "POST"],
  },
});

// --------------------------
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://vvlvtj-5173.csb.app",
    "http://localhost:5174",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});
app.use(express.json());
app.use("/api/v1", v1Routes);
app.use("/home", v2Routes);
app.use("/careerjob", v3Routes);
app.use(authRoutes);

app.use("*", notFoundHandler);
app.use(errorHandler);
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

/* ------------------------saving each connected user id with there socket id-------------------- */
const userSockets = {};
io.on("connection", (socket) => {
  socket.on("sendToken", ({ token }) => {
    const parsedToken = jwt.verify(token, SECRET);
    const userId = parsedToken.id;
    console.log(
      `Received token from the client, User with ID ${userId} connected: welcome ${parsedToken.username}`
    );
    userSockets[userId] = socket.id;
  });
  /*---------------------- handle friend request notification - mohannad ------------------------ */
  // -------- incoming friend request ---
  socket.on("friendRequest", async (data) => {
    console.log("Received friend request: and stored in database", data);
    const receiverUserId = data.receiverId;
    // Look up the receiver's socket ID using their user ID from the mapping
    const receiverSocketId = userSockets[receiverUserId];

    if (receiverSocketId) {
      // If the receiver's socket ID is found in the mapping, emit the friendRequestNotification event
      // Create a new entry in the notificationModel table
      const notification = await notificationModel.create({
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        message: data.message,
        action_type: "friend_request",
        is_seen: true,
      });

      io.to(receiverSocketId).emit("friendRequest", {
        notificationId: notification.id,
        senderId: data.senderId,
        senderName: data.senderName,
        message: data.message,
      });
    } else {
      console.log(`Receiver with user ID ${receiverUserId} is not connected.`);
      // Handle the case when the receiver is not currently connected (optional)
      // For example, you can store the notification in the database and deliver it when the receiver reconnects
      const notification = await notificationModel.create({
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        message: data.message,
        action_type: "friend_request",
        is_seen: false,
      });
    }
  });
  // -------- incoming friend request ---

  //-----------firend request handler ---
  socket.on("friendRequestHandled", (data) => {
    console.log(" friend request is handled and stored in database", data);
    const senderUserId = data.senderId;
    // Look up the receiver's socket ID using their user ID from the mapping
    const senderSocketId = userSockets[senderUserId];

    if (senderSocketId) {
      // If the receiver's socket ID is found in the mapping, emit the friendRequestNotification event
      const notification = notificationModel.create({
        sender_id: senderUserId,
        receiver_id: data.receiverId,
        message: data.message,
        action_type: "friend_request",
        is_seen: true,
      });
      io.to(senderSocketId).emit("friendRequestHandled", {
        notificationId: notification.id,
        senderId: senderUserId,
        senderName: data.senderName,
        message: data.message,
      });
    } else {
      console.log(`Receiver with user ID ${receiverUserId} is not connected.`);
      // Handle the case when the receiver is not currently connected (optional)
      // For example, you can store the notification in the database and deliver it when the receiver reconnects
      const notification = notificationModel.create({
        sender_id: senderUserId,
        receiver_id: data.receiverId,
        message: data.message,
        action_type: "friend_request",
        is_seen: false,
      });
    }
  });

  //-----------firend request handler ---
  /*---------------------- handle friend request notification - mohannad--------------------- */
  /*---------------------- handle message and message notification - mohannad ------------------------ */
  socket.on("newMessage", async (data) => {
    try {
      const receiverUserId = data.receiverId; // Replace this with the actual receiver's user ID

      // Look up the receiver's socket ID using their user ID from the mapping
      const receiverSocketId = userSockets[receiverUserId];

      if (receiverSocketId) {
        // Emit the custom event "newMessage" to the receiver's socket
        io.to(receiverSocketId).emit("newMessage", {
          senderId: data.senderId,
          senderName: data.senderName,
          message: data.message,
        });
      } else {
        console.log(
          `Receiver with user ID ${receiverUserId} is not connected.`
        );
        notificationModel.create({
          sender_id: data.senderId,
          receiver_id: data.receiverId,
          message: data.message,
          action_type: "new_message",
        });
      }
    } catch (error) {
      console.error("Error sending message notification:", error);
    }
  });
  /*---------------------- handle message and message notification - mohannad------------------------- */
  async function isEmployee(userId, companyId) {
    try {
      // Find the user by the userId
      const User = await user.findByPk(userId);

      // If the user is not found, they are not an employee
      if (!User) {
        return false;
      }

      // Check if the user is an employee of the company
      const employee = await employeesTable.findOne({
        where: {
          company_id: companyId,
          employee_id: userId,
        },
      });

      // Return true if the user is an employee, otherwise false
      return !!employee || userId == companyId;
    } catch (error) {
      console.error("Error checking if user is an employee:", error);
      return false; // Return false in case of an error
    }
  }
  async function isCompanyUser(userId, companyId) {
    try {
      // Find the user by the userId
      const User = await user.findByPk(userId);

      // If the user is not found or their role is not "company", they are not a company user
      if (!User || User.role !== "company") {
        return false;
      }

      // Check if the user's company ID matches the provided companyId
      return userId === companyId;
    } catch (error) {
      console.error("Error checking if user is a company user:", error);
      return false; // Return false in case of an error
    }
  }
  /*---------------------- handle message and message notification for compayn- mohannad ------------------------ */
  socket.on("joinCompanyRoom", async (data) => {
    // Verify if the user is an employee of the company
    const Employee = await isEmployee(data.userId, data.companyId);
    console.log(data.userId, data.companyId, data.roomType);
    if (!Employee) {
      // If the user is not an employee, emit an error message to the client
      socket.emit("errorMessage", {
        message: "You are not authorized to join this room.",
      });
      return;
    }

    const roomName = `company-${data.companyId}-${data.roomType}`;
    console.log(roomName);
    // Add the user to the company room
    socket.join(roomName);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const roomName = `company-${data.companyId}-${data.roomType}`;
      console.log(roomName);
      // Check if the user has joined the room
      if (!socket.rooms.has(roomName)) {
        // If the user has not joined the room, emit an error message to the client
        socket.emit("errorMessage", {
          message: "You are not authorized to send messages in this room.",
        });
        return;
      }

      // If the room is private (announcements), check if the user is the company user
      if (data.roomType === "announcements") {
        // Check if the user is the company user and has the same company ID as the room
        const CompanyUser = await isCompanyUser(data.userId, data.companyId);

        if (!CompanyUser) {
          // If the user is not the company, emit an error message to the client
          socket.emit("errorMessage", {
            message: "Only the company can send messages in this room.",
          });
          return;
        }
      }

      // Save the message to the database
      await chatRoomTable.create({
        room: roomName,
        roomType: data.roomType,
        message: "data.message",
        senderId: data.userId, // Assuming you have set the user ID on the socket object after authentication
      });

      // Broadcast the message to all users in the room
      socket.broadcast.to(roomName).emit("messageReceived", {
        message: data.message,
        senderId: data.userId,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });
  /*---------------------- handle message and message notification for compayn- mohannad ------------------------ */

  // Handle disconnection if needed
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const disconnectedUserId = Object.keys(userSockets).find(
      (userId) => userSockets[userId] === socket.id
    );

    if (disconnectedUserId) {
      // Remove the disconnected user's ID from the userSockets object
      delete userSockets[disconnectedUserId];
      console.log(`User with ID ${disconnectedUserId} has been disconnected.`);
    } else {
      console.log("User not found in userSockets.");
    }
  });
});

/*---------------------------------------------------------------------------------------- */

module.exports = {
  server: app,
  start: (port) => {
    server.listen(port, () => {
      console.log(`Server Up on ${port}`);
    });
  },
};
