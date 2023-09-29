"use strict";
require("dotenv").config();
const express = require("express");
const dataModules = require("../models");
const bearerAuth = require("../auth/middleware/bearer");
const permissions = require("../auth/middleware/acl");
const checkId = require("../auth/middleware/checkId");
const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET || "secretstring";
const port = process.env.PORT || 3001;
const { Sequelize } = require("sequelize");
const userupdate = require("../auth/middleware/adminupdate");
const { Op } = require("sequelize");
const { OPEN_PRIVATECACHE } = require("sqlite3");
const {
  userModel,
  users,
  posts,
  postsModel,
  jobcomments,
  jobs,
  comments,
  friendRequests,
  likes,
  friends,
  notification,
  favorites,
  notificationModel,
  chat,
  cv,
  joinRequests,
  followers,
  applyjob,
  employeesTable,
  jobsTable,
  chatRoomTable,
} = require("../models/index");

const router = express.Router();

router.get("/", welcomeHandler);
function welcomeHandler(req, res) {
  res.status(200).send("Welcome to CareerConnect");
}

////////////////////////////// Notification model
router.get("/usernotification", bearerAuth, userNotifications);
async function userNotifications(req, res) {
  const userId = req.user.id;
  let username = req.user.username;

  let notifications = await notificationModel.findAll({
    where: {
      receiver_id: userId,
    },
  });
  notification.username = username;
  res.status(200).json(notifications);
}

router.get("/favoriteposts", bearerAuth, getFavoritePosts);
async function getFavoritePosts(req, res) {
  try {
    const userId = req.user.id;

    const favoritePosts = await favorites.findAll({
      where: { user_id: userId },
    });

    res.status(200).json(favoritePosts);
  } catch (error) {
    console.error("Error fetching favorite posts:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

///////////////////////////// Notification model

///////////////////////////////////////////////////////////////////////// private and public posts motasem
router.get("/homeposts", bearerAuth, handleShowHomePosts);

async function handleShowHomePosts(req, res) {
  try {
    const userId = req.user.id;
    const myfriends = await friends.findAll({
      attributes: ["friend_id"],
      where: {
        user_id: userId,
      },
    });

    // Extract friend IDs from the result and send the response
    const friendIds = myfriends.map((friend) => friend.friend_id);

    ///////////////////////////////
    const myCompany = await followers.findAll({
      // attributes: ["friend_id"],
      where: {
        sender_id: userId,
      },
    });

    // Extract friend IDs from the result and send the response
    const companyIds = myCompany.map((Company) => Company.receiver_id);

    // Fetch private posts of yourself and your friends
    const homePosts = await postsModel.findAll({
      where: {
        [Op.or]: [
          { user_id: userId },
          { user_id: { [Op.in]: friendIds } },
          { user_id: { [Op.in]: companyIds } },
        ],
      },
    });

    // // 3. Fetch public posts
    // const publicPosts = await postsModel.findAll({
    //   where: { status: "public" },
    // });

    res.status(200).json(homePosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching posts." });
  }
}

//---------------------------------------------------------- home posts privet& public   ^^^^^^^^^^
//---------------------------------------------------------- user posts privet& public   vvvvvvvvv

router.get("/userposts/:id", bearerAuth, handleShowUserPosts);

async function handleShowUserPosts(req, res) {
  try {
    const userId = req.user.id;
    const myfriends = await friends.findOne({
      attributes: ["friend_id"],
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: req.params.id },
          { user_id: req.params.id, friend_id: userId },
        ],
      },
    });

    // const userPosts = await postsModel.findAll({
    //   where: { user_id: req.params.id , status: "public" },
    // });

    if (myfriends || req.user.id == req.params.id) {
      const userPosts = await postsModel.findAll({
        where: { user_id: req.params.id },
      });
      res.status(200).json(userPosts);
    } else {
      const userPosts = await postsModel.findAll({
        where: { user_id: req.params.id, status: "public" },
      });
      res.status(200).json(userPosts);
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching posts." });
  }
}

///////////////////////////////////////////////////////////////////////// private and public posts motasem
//------------------------------------------------------
//-----------------------friend requests routes mohannad
router.post("/send-friend-request/:id", bearerAuth, sendFriendRequest);
async function sendFriendRequest(req, res) {
  const userId = req.user.id;
  let username = req.user.username;

  const friendId = req.params.id;
  try {
    const user = await userModel.findByPk(userId);
    if (user.role === "company") {
      return res
        .status(400)
        .json({ message: "Companies cannot send friend requests." });
    }

    // Check if the user you are sending the request to is a company
    const friendUser = await userModel.findByPk(friendId);
    if (friendUser.role === "company") {
      return res
        .status(400)
        .json({ message: "You cannot send friend requests to companies." });
    }

    const existingRequestFromSender = await friendRequests.findOne({
      where: {
        sender_id: userId,
        receiver_id: friendId,
      },
    });

    // Check if there is an existing friend request from receiver to sender
    const existingRequestFromReceiver = await friendRequests.findOne({
      where: {
        sender_id: friendId,
        receiver_id: userId,
      },
    });
    const areFriends = await friends.findOne({
      where: {
        user_id: userId,
        friend_id: friendId,
      },
    });
    if (areFriends) {
      return res.status(400).json({
        message: "you are already friends",
      });
    } else if (existingRequestFromSender || existingRequestFromReceiver) {
      return res.status(400).json({
        message: "there is a pending friend request between both of you",
      });
    }
    // Create a new friend request
    await friendRequests.create({
      sender_id: userId,
      username: username,
      receiver_id: friendId,
      message:`${username} sent you a friend request`
    });
    return res
      .status(200)
      .json({ message: "Friend request sent successfully." });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res
      .status(500)
      .json({ message: "An error occurred while sending friend request." });
  }
}

router.get("/friends", bearerAuth, Friends);
async function Friends(req, res) {
  const friendsReq = await friends.findAll();
  res.status(200).json(friendsReq);
}
router.get("/friendsreq", bearerAuth, Friendsreq);
async function Friendsreq(req, res) {
  const friendsReq = await friendRequests.findAll();
  res.status(200).json(friendsReq);
}

//////////////////////////////////////////////////////////////////////////////////////// friends routes motasem

// /*------------------*/

router.get("/myfriends", bearerAuth, getFriends);

async function getFriends(req, res) {
  try {
    const userId = req.user.dataValues.id; // Get the user ID from the authenticated user's token

    // Find the user by ID and include their friends using the "friends" association
    const user = await userModel.findByPk(userId, {
      include: [
        {
          association: "friend",
          attributes: [
            "id",
            "username",
            "firstName",
            "lastName",
            "profilePicture",
          ],
        },
      ],
    });

    // Extract only the friends from the user object
    const friends = user.friend;

    return res.status(200).json(friends);
  } catch (error) {
    console.error("Error retrieving friends:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving friends." });
  }
}

// /*------------------*/
router.get("/received-friend-requests", bearerAuth, viewFriendRequests);
async function viewFriendRequests(req, res) {
  try {
    const receiverid = req.user.dataValues.id; //from tocken

    const receivedFriendRequests = await friendRequests.findAll({
      where: {
        receiver_id: receiverid,
        status: "pending", // Filter by status: "pending"
      },
    });

    if (receivedFriendRequests.length === 0) {
      return res.status(404).json({
        message: "No pending friend requests .",
      });
    }
    return res.status(200).json(receivedFriendRequests);
  } catch (error) {
    console.error("Error retrieving received friend requests:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving received friend requests.",
    });
  }
}
// /*------------------*/

router.post("/handle-friend-request/:id", bearerAuth, handleFriendRequest);

async function handleFriendRequest(req, res) {
  const userId = req.user.id;
  const senderid = req.params.id;
  const { action } = req.body;

  const friendRequest = await friendRequests.findOne({
    where: {
      sender_id: senderid,
      receiver_id: userId,
    },
  });
  if (!friendRequest) {
    return res.status(404).json({ message: "Friend request not found." });
  }

  if (action === "accept") {
    friendRequest.status = "accepted";

    // Save the updated status in the database
    await friendRequest.save();

    // Create friendship records

    await friends.create({ user_id: userId, friend_id: senderid });
    await friends.create({ user_id: senderid, friend_id: userId });
  } else if (action === "decline") {
    friendRequest.status = "declined";
    // Remove the friend request record from the database
    await friendRequest.destroy();
  } else {
    return res.status(400).json({ message: "Invalid action." });
  }

  return res.status(200).json({
    message: `Friend request is ${friendRequest.status} successfully.`,
  });
}

router.delete("/unfriend/:id", bearerAuth, handleDeleteFriend);

async function handleDeleteFriend(req, res) {
  try {
    const friendid = req.params.id;
    const userid = req.user.id;

    const checkFriend = await friends.findOne({
      where: {
        [Sequelize.Op.or]: [
          { user_id: userid, friend_id: friendid },
          { user_id: friendid, friend_id: userid },
        ],
      },
    });

    if (!checkFriend) {
      return res.status(200).json("You are not friends yet");
    }

    const unFriend = await friends.destroy({
      where: {
        [Sequelize.Op.or]: [
          { user_id: userid, friend_id: friendid },
          { user_id: friendid, friend_id: userid },
        ],
      },
    });

    const deleteFriendsReq = await friendRequests.destroy({
      where: {
        [Sequelize.Op.or]: [
          { receiver_id: userid, sender_id: friendid },
          { receiver_id: friendid, sender_id: userid },
        ],
      },
    });

    return res.status(200).json("unfriended successfully");
  } catch (error) {
    console.error("Error retrieving received friend requests:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving received friend requests.",
    });
  }
}

//------------------------friend requests routes mohannad
//------------------------------------------------------

//------------------------------------------------------
//-----------------------JOIN requests routes aljamal
router.post("/handle-join-request/:id", bearerAuth, handleJoinRequest);

async function handleJoinRequest(req, res) {
  const userId = req.user.id;
  const senderid = req.params.id;
  const { action } = req.body;

  const joinRequest = await joinRequests.findOne({
    where: {
      sender_id: senderid,
      receiver_id: userId,
    },
  });
  if (!joinRequest) {
    return res.status(404).json({ message: "join request not found." });
  }

  if (action === "accept") {
    joinRequest.status = "accepted";

    // Save the updated status in the database
    await joinRequest.save();
    await employeesTable.create({
      company_id: userId,
      employee_id: senderid,
    });

    await userModel.update(
      { employed: true },
      {
        where: {
          id: senderid,
        },
      }
    );

    // Create friendship records
  } else if (action === "decline") {
    joinRequest.status = "declined";
    // Remove the friend request record from the database
    await joinRequest.destroy();
  } else {
    return res.status(400).json({ message: "Invalid action." });
  }

  return res.status(200).json({
    message: `join request is ${joinRequest.status} successfully.`,
  });
}

router.post("/send-join-request/:id", bearerAuth, SendJoinRequest);
async function SendJoinRequest(req, res, next) {
  try {
    // check if the users exist
    const receiverid = req.params.id;
    const receiver = await users.get(receiverid);
    const { employee_code } = req.body;
    let username = req.user.username;
    console.log(receiverid, receiver);
    if (req.user.role !== "company" && receiver.dataValues.role == "company") {
      // check if the users exist
      const senderid = req.user.dataValues.id; //from tocken
      const sender = await users.get(senderid);

      if (!sender || !receiver) {
        return res.status(404).json("User not found.");
      }
      // check if the request is already sent so that it doesnet dublicate
      const existingRequest = await joinRequests.findOne({
        where: {
          sender_id: senderid,
          receiver_id: receiverid,
        },
      });

      if (existingRequest) {
        return res.status(400).json("Join request already sent.");
      }

      // create the new Join request
      // Create a new Join request entry in the JoinRequest table
      await joinRequests.create({
        sender_id: senderid,
        username: username,
        employee_code: employee_code,
        receiver_id: receiverid,
        message: `you have a join request from ${sender.dataValues.username}`,
      });

      return res.status(200).json("Join request sent successfully.");
    } else {
      return res.status(200).json("you don't have Permission");
    }
  } catch (error) {
    next("an error occured, the Join request failed");
  }
}
/*------------------*/
router.get("/received-Join-requests", bearerAuth, viewJoinRequests);
async function viewJoinRequests(req, res, next) {
  try {
    if (req.user.dataValues.role == "company") {
      const receiverid = req.user.dataValues.id; //from tocken

      const receivedJoinRequests = await joinRequests.findAll({
        where: { receiver_id: receiverid },
      });

      if (receivedJoinRequests.length === 0) {
        return res.status(404).json({
          message: "No Join requests received for the specified user.",
        });
      }
      return res.status(200).json(receivedJoinRequests);
    } else {
      return res.status(200).json("you don't have Permission");
    }
  } catch (error) {
    console.error("Error retrieving received friend requests:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving received friend requests.",
    });
  }
}

router.get("/company/employees", bearerAuth, getCompanyEmployees);
async function getCompanyEmployees(req, res) {
  const companyId = req.user.id; // Assuming the user ID represents the company ID

  try {
    // Get all employees associated with the company along with specific user information
    const companyEmployees = await employeesTable.findAll({
      where: {
        company_id: companyId,
      },
      include: [
        {
          model: userModel,
          as: "employee",
          attributes: [
            "id",
            "username",
            "career",
            "email",
            "address",
            "phoneNumber",
          ],
        },
      ],
    });

    // Modify the response to include only desired fields
    const simplifiedEmployees = companyEmployees.map((employee) => {
      const { id, username, career, email, address, phoneNumber } =
        employee.employee;
      return { id, username, career, email, address, phoneNumber };
    });

    res.json(simplifiedEmployees);
  } catch (error) {
    console.error("Error retrieving company employees:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving company employees.",
    });
  }
}

router.delete("/unjoin/:id", bearerAuth, handleDeleteJoin);

async function handleDeleteJoin(req, res) {
  try {
    const companyid = req.params.id;
    const employedid = req.user.id;

    const checkJoin = await employeesTable.findOne({
      where: {
        [Sequelize.Op.or]: [
          { company_id: companyid, employee_id: employedid },
          { company_id: employedid, employee_id: companyid },
        ],
      },
    });

    if (!checkJoin) {
      return res.status(200).json("You are not employee in this company");
    }

    const unJoin = await employeesTable.destroy({
      where: {
        [Sequelize.Op.or]: [
          { employee_id: companyid, company_id: employedid },
          { employee_id: employedid, company_id: companyid },
        ],
      },
    });

    const deleteJoinReq = await joinRequests.destroy({
      where: {
        [Sequelize.Op.or]: [
          { receiver_id: companyid, sender_id: employedid },
          { receiver_id: employedid, sender_id: companyid },
        ],
      },
    });

    await userModel.update(
      { employed: false },
      {
        where: {
          [Sequelize.Op.or]: [{ id: companyid }, { id: employedid }],
        },
      }
    );

    return res.status(200).json("unjoined successfully");
  } catch (error) {
    console.error("Error retrieving received join requests:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving received join requests.",
    });
  }
}

//------------------------JOIN requests routes aljamal
//------------------------------------------------------

//------------------------------------------------------
//-----------------------Followers routes aljamal

router.post("/makefollow/:id", bearerAuth, makeFollow);
async function makeFollow(req, res, next) {
  try {
    // check if the users exist
    const receiverid = req.params.id;
    const receiver = await users.get(receiverid);

    if (receiver.dataValues.role == "company") {
      // check if the users exist
      const senderid = req.user.dataValues.id; //from tocken
      const sender = await users.get(senderid);

      if (!sender || !receiver) {
        return res.status(404).json("User not found.");
      }
      // check if the request is already sent so that it doesnet dublicate
      const existingRequest = await followers.findOne({
        where: {
          sender_id: senderid,
          receiver_id: receiverid,
        },
      });

      if (existingRequest) {
        return res
          .status(400)
          .json(
            `You are already follow ${receiver.dataValues.username} company`
          );
      }

      // create the new Join request
      // Create a new Join request entry in the JoinRequest table
      await followers.create({
        sender_id: senderid,
        receiver_id: receiverid,
      });

      return res
        .status(200)
        .json(`You are now following ${receiver.dataValues.username} company.`);
    } else {
      return res.status(200).json("you don't have Permission");
    }
  } catch (error) {
    next("an error occured, the Join request failed");
  }
}
/*------------------*/
router.get("/followers", bearerAuth, viewFollowers);
async function viewFollowers(req, res, next) {
  try {
    if (req.user.dataValues.role == "company") {
      const receiverid = req.user.dataValues.id; //from token

      const receivedFollowers = await followers.findAll({
        where: { receiver_id: receiverid },
        include: [
          {
            model: userModel,
            as: "sender",
          },
        ],
      });

      if (receivedFollowers.length === 0) {
        return res
          .status(404)
          .json("there is no followers to your company yet");
      }

      // Modify the response to include only user id and username
      const simplifiedFollowers = receivedFollowers.map((follower) => ({
        user_id: follower.sender.id,
        username: follower.sender.username,
      }));

      return res.status(200).json(simplifiedFollowers);
    } else {
      return res.status(200).json("you don't have Permission");
    }
  } catch (error) {
    console.error("Error retrieving received followers:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving received followers.",
    });
  }
}

router.get("/followers/:id", bearerAuth, viewFollowersbyId);
async function viewFollowersbyId(req, res, next) {
  try {
    // if (req.user.dataValues.role == "company") {
    const receiverid = req.params.id; //from tocken

    const receivedFollowers = await followers.findAll({
      where: { receiver_id: receiverid },
      include: [
        {
          model: userModel,
          as: "sender",
        },
      ],
    });

    /////
    const company = await userModel.findOne({
      where: { id: receiverid },
    });

    if (receivedFollowers.length === 0) {
      return res
        .status(404)
        .json(`there is no followers to ${company.username} company yet`);
    }

    return res.status(200).json(receivedFollowers);
    // } else {
    //   return res.status(200).json("you don't have Permission");
    // }
  } catch (error) {
    console.error("Error retrieving received friend requests:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving received friend requests.",
    });
  }
}

router.delete("/unfollow/:id", bearerAuth, handleDeleteFollow);

async function handleDeleteFollow(req, res) {
  try {
    const receiverid = req.params.id;
    const senderid = req.user.id;

    const checkFollow = await followers.findOne({
      where: { sender_id: senderid, receiver_id: receiverid },
    });

    if (!checkFollow) {
      return res.status(200).json("you don't follow the given company");
    }

    const unFollow = await followers.destroy({
      where: { sender_id: senderid, receiver_id: receiverid },
    });
    return res.status(200).json("unfollowed successfully");
  } catch (error) {
    console.error("Error retrieving received follow requests:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving received follow requests.",
    });
  }
}

//------------------------Followers routes aljamal
//------------------------------------------------------

//------------------------------------------------------
//----------------------- Chat aljamal
router.post("/sendMessage/:id", bearerAuth, SendMessage);
async function SendMessage(req, res, next) {
  try {
    // check if the users exist
    const receiverid = req.params.id;
    const senderid = req.user.dataValues.id; //from tocken

    const sender = await users.get(senderid);
    const receiver = await users.get(receiverid);

    const sendername = req.user.dataValues.username;
    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    // create new Message
    await chat.create({
      sender_id: senderid,
      receiver_id: receiverid,
      message: req.body.message,
      sender_name: sendername,
    });

    return res.status(200).json({ message: "the message sent successfully." });
  } catch (error) {
    next("an error occured, the sent message failed");
  }
}
/*------------------*/

router.get("/chat", viewAllMessages);
async function viewAllMessages(req, res) {
  const ma = await chat.findAll();
  return res.status(200).json(ma);
}

/*-----------------*/
router.get("/chat/:id", bearerAuth, viewMessages);
async function viewMessages(req, res) {
  try {
    const receiverid = req.params.id;
    const senderid = req.user.dataValues.id; //from tocken

    const receivedMessage = await chat.findAll({
      where: {
        [Sequelize.Op.or]: [
          { sender_id: senderid, receiver_id: receiverid },
          { sender_id: receiverid, receiver_id: senderid },
        ],
      },
      // order: [['timestamp', 'ASC']],
    });

    return res.status(200).json(receivedMessage);
  } catch (error) {
    console.error("Error retrieving received the messages:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving received the messages.",
    });
  }
}
//------------------------Chat aljamal
//------------------------------------------------------

router.get("/companychat", bearerAuth, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in the request

    // Retrieve the user's role to determine if they are a company or employee
    const user = await userModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let companyId;
    if (user.role === "company") {
      // If the user is a company, use their own company ID
      companyId = user.id;
    } else {
      // If the user is an employee, get their associated company ID
      const employeeRecord = await employeesTable.findOne({
        where: {
          employee_id: userId,
        },
      });

      if (!employeeRecord) {
        return res.status(404).json({ message: "Employee record not found." });
      }
      companyId = employeeRecord.company_id;
    }

    // Retrieve messages from private rooms where the user's company is the sender
    const privateRoomMessages = await chatRoomTable.findAll({
      where: {
        roomType: "announcements",
        senderId: companyId,
      },
      include: [
        {
          model: userModel,
          as: "senderInfo",
          attributes: ["username"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Retrieve messages from the general room of the user's company
    const generalRoomName = `company-${companyId}-general`;
    const generalRoomMessages = await chatRoomTable.findAll({
      where: {
        room: generalRoomName,
      },
      include: [
        {
          model: userModel,
          as: "senderInfo",
          attributes: ["username"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.json({ privateRoomMessages, generalRoomMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching messages." });
  }
});
//------------------------------------------------------
//----------------------- applying jobs aljamal
router.post("/applyjob/:id", bearerAuth, applyJob);
async function applyJob(req, res, next) {
  try {
    // check if the users exist
    const userCv= await cv.getCv(req.user.id)
    const jobid = req.params.id;
    const job = await jobs.get(jobid);
    const companyid = job.dataValues.user_id;
    const company = await users.get(companyid);
    console.log(
      "----------------------------------------------------------->",
      company.username
    );

    if (req.user.role !== "company") {
      // check the id of the applyer for the job

      // check if the users exist
      const applyerid = req.user.dataValues.id; //from tocken
      const applyer = await users.get(applyerid);
      // console.log(applyer.dataValues.)
      if (!company || !applyer) {
        return res.status(404).json("User not found.");
      }
      // check if the request is already sent so that it doesnet dublicate
      const existingApply = await applyjob.findOne({
        where: {
          job_id: jobid,
          applyer_id: applyerid,
        },
      });

      if (existingApply) {
        return res.status(400).json("You are already apply to this job");
      }

      // create the new Join request
      // Create a new Join request entry in the JoinRequest table
      await applyjob.create({
        job_id: jobid,
        cv_link:userCv.cv_link,
        applyer_id: applyerid,
        company_name: company.username,
      });

      return res.status(200).json("You applied to this job successfully.");
    } else {
      return res.status(200).json("you don't have Permission");
    }
  } catch (error) {
    next("an error occured, the Join request failed");
  }
}

// the get in v3
//------------------------applying jobs aljamal

router.get("/applicants/:jobId", bearerAuth, async (req, res) => {
  try {
    // Check if the user is a company
    if (req.user.role !== "company") {
      return res
        .status(403)
        .json({ message: "You don't have permission to perform this action." });
    }

    const jobId = req.params.jobId;

    // Find the job in the database
    const job = await jobsTable.findOne({
      where: {
        id: jobId,
        user_id: req.user.id, // Make sure the requesting company owns the job
      },
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    // Find all job applications for the specified job
    const applicants = await applyjob.findAll({
      where: {
        job_id: jobId,
      },
      include: [
        {
          model: userModel,
          as: "user",
          attributes: [
            "username",
            "firstName",
            "lastName",
            "email",
            "profilePicture",
          ],
        },
      ],
    });

    if (!applicants || applicants.length === 0) {
      return res
        .status(404)
        .json({ message: "No applicants found for this job." });
    }

    return res.json({ applicants });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching applicants." });
  }
});
// aply job responce

router.post("/jobresponse/:id", bearerAuth, jobResponse);
async function jobResponse(req, res, next) {
  // try {
  // Check if the user is a company
  if (req.user.role !== "company") {
    return res
      .status(403)
      .json({ message: "You don't have permission to perform this action." });
  }

  // Get the job application ID from the request parameters
  const applicationId = req.params.id;

  // Find the job application in the database
  const application = await applyjob.findOne({
    where: {
      id: applicationId,
    },
    include: [
      {
        model: jobsTable,
        as: "job",
        attributes: ["user_id"], // Include the job's user_id to check if the company owns the job
      },
    ],
  });

  if (!application) {
    return res.status(404).json({ message: "Job application not found." });
  }

  // Check if the job application is for a job posted by the company
  const job = application.job;
  if (!job || job.user_id !== req.user.id) {
    return res.status(403).json({
      message: "You don't have permission to respond to this job application.",
    });
  }

  // Get the company's response from the request body
  const { status, interviewDate, interviewLocation, rejectionReason } =
    req.body;

  // Update the job application with the company's response
  application.status = status;
  application.interviewDate = interviewDate;
  application.interviewLocation = interviewLocation;
  application.rejectionReason = rejectionReason;
  await application.save();

  return res
    .status(200)
    .json({ message: "Job application response updated successfully." });
  //   } catch (error) {
  //     next("An error occurred while updating the job application response.");
  //   }
}

router.get("/applicationStatus/", bearerAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all job applications made by the authenticated user
    const applications = await applyjob.findAll({
      where: {
        applyer_id: userId,
      },
      include: [
        {
          model: jobsTable,
          as: "job",
          attributes: ["job_title"],
        },
      ],
      attributes: [
        "id",
        "status",
        "interviewDate", // Include interview date
        "interviewLocation",
        "company_name",
      ], // Include interview location], // Include the application ID and status
    });

    if (!applications || applications.length === 0) {
      return res
        .status(404)
        .json({ message: "No job applications found for this user." });
    }

    // Transform the applications data if needed
    const transformedApplications = applications.map((application) => {
      return {
        applicationId: application.id,
        company: application.company_name,
        jobTitle: application.job.job_title,
        status: application.status,
        interviewDate: application.interviewDate,
        interviewLocation: application.interviewLocation,
      };
    });

    return res.json({ applications: transformedApplications });
  } catch (error) {
    console.error("Error fetching job application status:", error);
    return res.status(500).json({
      message: "An error occurred while fetching job application status.",
    });
  }
});
//------------------------------------------------------

router.param("model", (req, res, next) => {
  const modelName = req.params.model;
  if (dataModules[modelName]) {
    req.model = dataModules[modelName];
    next();
  } else {
    next("Invalid Model");
  }
});

router.get("/cv", bearerAuth, handleGetAllCV);
router.get("/cv/:id", bearerAuth, handleGetOneCV);
router.get("/cvtitle/:title", bearerAuth, handleGetCVbyTitle);
router.get("/cvfield/:field", bearerAuth, handleGetCVbyfield);
router.get("/cv/:title/:field", bearerAuth, handleGetCVbyTitleAndField);
router.post("/cv", bearerAuth, handleCreateCV);

router.get("/:model", bearerAuth, handleGetAll);
router.get("/:model/:id", bearerAuth, handleGetOne);
router.post("/likes", bearerAuth, handleCreateLikes);
router.post("/:model", bearerAuth, handleCreate);
// router.put("/:model/:id", bearerAuth, checkId, handleUpdate);
router.put("/:model/:id", bearerAuth, userupdate, handleUpdate);
router.delete("/:model/:id", bearerAuth, checkId, handleDelete);

router.get("/jobs/:id/jobcomments", bearerAuth, jobComments);
router.get("/posts/:id/comments", bearerAuth, postComments);
router.get("/posts/:id/likes", bearerAuth, postLikes);

async function jobComments(req, res) {
  const jobId = parseInt(req.params.id);
  let jcomments = await jobs.getUserPosts(jobId, jobcomments.model);
  res.status(200).json(jcomments);
}

async function postComments(req, res) {
  const postId = parseInt(req.params.id);
  let pcomments = await posts.getUserPosts(postId, comments.model);
  res.status(200).json(pcomments);
}
async function postLikes(req, res) {
  const postId = parseInt(req.params.id);
  let pLikes = await posts.getUserPosts(postId, likes.model);
  res.status(200).json(pLikes);
}

router.get("/users/:id/:model", bearerAuth, userRecords);

async function userRecords(req, res) {
  const userId = parseInt(req.params.id);
  let userRecord = await users.getUserPosts(userId, req.model.model);
  res.status(200).json(userRecord);
}

// async function jobComments(req, res) {
//   const jobId = parseInt(req.params.id);
//   let jcomments = await jobs.getUserPosts(jobId, jobcomments.model);
//   res.status(200).json(jcomments);
// }
// async function postComments(req, res) {
//   const postId = parseInt(req.params.id);
//   let pcomments = await posts.getUserPosts(postId, comments.model);
//   res.status(200).json(pcomments);
// }

async function handleGetAll(req, res) {
  let allRecords = await req.model.get();

  res.status(200).json(allRecords);
}

async function handleGetOne(req, res) {
  const id = req.params.id;
  let theRecord = await req.model.get(id);
  res.status(200).json(theRecord);
}

async function handleCreate(req, res) {
  let obj = req.body;
  let userId = req.user.id;
  let username = req.user.username;
  obj.user_id = userId;
  obj.username = username;
  console.log(obj);
  let newRecord = await req.model.create(obj);
  res.status(201).json(newRecord);
}
// async function handleCreateLikes(req, res) {
//   let obj = req.body;
//   let userId=req.user.id;
//   obj["user_id"]=userId
//   // console.log(obj["user_id"])
//   let checkPost= await likes.checkPostId(obj["post_id"],obj["user_id"])
//   if(checkPost){
//     res.status(201).json(" you\'ve liked this post");

//   }else{

//     let newRecord = await likes.create(obj);
//     res.status(201).json(newRecord);
//   }

// }

async function handleCreateLikes(req, res) {
  let obj = req.body;
  let userId = req.user.id;
  let username = req.user.username;
  obj.user_id = userId;
  obj.username = username;
  console.log(userId);
  obj["user_id"] = userId;

  // Check if the user has already liked the post
  const existingLike = await likes.checkPostId(obj["post_id"], obj["user_id"]);
  if (existingLike) {
    res.status(400).json("You've already liked this post.");
  } else {
    // Create a new like record
    // try {
    const newRecord = await likes.create(obj);
    res.status(201).json(newRecord);
    // } catch (error) {
    // console.error(error);
    // res.status(500).json("An error occurred while creating the like.");
    // }
  }
}

async function handleUpdate(req, res) {
  const id = req.params.id;
  const obj = req.body;
  let updatedRecord = await req.model.update(id, obj);
  res.status(200).json(updatedRecord);
}

async function handleDelete(req, res) {
  let id = req.params.id;
  let deletedRecord = await req.model.delete(id);
  res.status(200).json("deleted successfully");
}

//--------------------------------------------------------CV get & creat & search ---------------------------

async function handleGetAllCV(req, res) {
  if (req.user.role !== "user") {
    let allRecords = await cv.get();
    const list = allRecords.map((cv) => cv.cv_link);
    res.status(200).json(list);
  } else {
    res.status(200).json("you dont have Permission");
  }
}

async function handleGetOneCV(req, res) {
  if (req.user.role != "user" || req.params.id == req.user.id) {
    const id = req.params.id;
    let theRecord = await cv.get(id);
    res.status(200).json(theRecord.cv_link);
  } else {
    res.status(200).json("you dont have Permission");
  }
}

async function handleCreateCV(req, res) {
  if (req.user.role !== "company") {
    let obj = req.body;
    let userId = req.user.id;
    obj.user_id = userId;
    let newRecord = await cv.create(obj);
    res.status(201).json(newRecord);
  } else {
    res.status(200).json("you dont have Permission to make cv");
  }
}
async function handleGetCVbyTitle(req, res) {
  if (req.user.role != "user" || req.params.id == req.user.id) {
    const title = req.params.title;
    let theRecord = await cv.getCVbyTitle(title);
    res.status(200).json(theRecord.cv_link);
  } else {
    res.status(200).json("you dont have Permission");
  }
}

async function handleGetCVbyTitleAndField(req, res) {
  if (req.user.role != "user" || req.params.id == req.user.id) {
    const title = req.params.title;
    const field = req.params.field;
    let allRecords = await cv.getCVbyTitleAndField(title, field);
    const list = allRecords.map((cv) => cv.cv_link);
    res.status(200).json(list);
  } else {
    res.status(200).json("you dont have Permission");
  }
}
router.post("/add-to-favorites/:postId", bearerAuth, addToFavorites);

async function addToFavorites(req, res) {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    // Check if the post and user exist
    const existingPost = await posts.get(postId);
    const existingUser = await users.get(userId);

    if (!existingPost || !existingUser) {
      return res.status(404).json({ message: "Post or user not found." });
    }

    // Check if the post is already in favorites
    const existingFavorite = await favorites.findOne({
      where: { user_id: userId, post_id: postId },
    });

    if (existingFavorite) {
      return res.status(400).json({ message: "Post is already in favorites." });
    }

    // Add the post to favorites
    await favorites.create({
      user_id: userId,
      post_id: postId,
    });

    return res.status(200).json({ message: "Post added to favorites." });
  } catch (error) {
    console.error("Error adding post to favorites:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}
async function handleGetCVbyfield(req, res) {
  if (req.user.role != "user" || req.params.id == req.user.id) {
    const field = req.params.field;
    let theRecord = await cv.getCVbyfield(field);
    res.status(200).json(theRecord.cv_link);
  } else {
    res.status(200).json("you dont have Permission");
  }
}

// router.get("/favoriteposts", bearerAuth, getFavoritePosts);
// async function getFavoritePosts(req, res) {
//   try {
//     const userId = req.user.id;
//     const favoritePosts = await favorites.findAll({
//       where: { user_id: userId },
//       include: [{ model: posts }],
//     });

//     res.status(200).json(favoritePosts);
//   } catch (error) {
//     console.error("Error fetching favorite posts:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// }

module.exports = router;
