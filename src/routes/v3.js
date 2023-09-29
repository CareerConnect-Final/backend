"use strict";
require("dotenv").config();
const express = require("express");
const {
  jobs,
  jobcomments,
  joblike,
  applyjobCollection,
} = require("../models/index");
const bearerAuth = require("../auth/middleware/bearer");
const permissions = require("../auth/middleware/checkrole");
const checkId = require("../auth/middleware/checkId");
const jwt = require("jsonwebtoken");
const { where } = require("sequelize");
const dataModules = { jobs };
const router2 = express.Router();

const likes = require("../models/likes/model01");

router2.param("model", (req, res, next) => {
  const modelName = req.params.model;
  if (dataModules[modelName]) {
    req.model = dataModules[modelName];
    next();
  } else {
    next("Invalid Model");
  }
});

router2.get("/jobs", bearerAuth, handleGetAll);
router2.get("/jobs/:id", bearerAuth, handleGetOne);
router2.get("/jobtitle/:title", bearerAuth, handleGetTitle);
router2.get("/jobcity/:title", bearerAuth, handleGetCIty);
router2.post("/jobs", bearerAuth, permissions(), handleCreate);
router2.post("/jobcomments", bearerAuth, handleCommentsCreate);
router2.get("/jobs/:id/jobcomments", bearerAuth, jobComments);
router2.get("/jobs/:id/likes", bearerAuth, postLikes);
router2.get("/job/:id/appliers", bearerAuth, jobapplyer);
router2.post("/likes", bearerAuth, handleCreateLikes);
router2.get("/likes", bearerAuth, handleGetAll);
router2.put("/:model/:id", bearerAuth, checkId, permissions(), handleUpdate);
router2.delete("/:model/:id", bearerAuth, checkId, permissions(), handleDelete);

async function handleGetAll(req, res) {
  let allRecords = await jobs.get();
  res.status(200).json(allRecords);
}

async function handleGetOne(req, res) {
  const id = req.params.id;
  let theRecord = await jobs.get(id);
  res.status(200).json(theRecord);
}
async function handleGetTitle(req, res) {
  // if(!parseInt(req.params.title)){
  const title = req.params.title.toLowerCase();

  let theRecord = await jobs.getJobTitle(title);
  res.status(200).json(theRecord);
  // }
  // else if(parseInt(req.params.title)){
  //   const title = req.params.title;
  // // console.log("model ========>", typeof(title))

  //     let theRecord = await req.model.get(title);
  //     res.status(200).json(theRecord);
  // }
}

// async function handleCreateLikes(req, res) {
//   let obj = req.body;
//   let userId = req.user.id;
//   obj.user_id = userId;
//   let checkPost = await joblike.checkJobPostId(obj["job_id"]);
//   if (checkPost) {
//     res.status(201).json(" you've liked this post");
//   } else {
//     let newRecord = await joblike.create(obj);
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
  const existingLike = await joblike.checkJobPostId(
    obj["job_id"],
    obj["user_id"]
  );
  if (existingLike) {
    res.status(400).json("You've already liked this post.");
  } else {
    // Create a new like record
    // try {
    const newRecord = await joblike.create(obj);
    res.status(201).json(newRecord);
    // } catch (error) {
    // console.error(error);
    // res.status(500).json("An error occurred while creating the like.");
    // }
  }
}

async function postLikes(req, res) {
  const postId = parseInt(req.params.id);
  let pLikes = await jobs.getUserPosts(postId, joblike.model);
  res.status(200).json(pLikes);
}

async function handleCommentsCreate(req, res) {
  let obj = req.body;
  let userId = req.user.id;
  let username = req.user.username;
  obj.user_id = userId;
  obj.username = username;
  let newRecord = await jobcomments.create(obj);
  res.status(201).json(newRecord);
}

async function handleGetCIty(req, res) {
  const title = req.params.title;

  let theRecord = await jobs.getJobCity(title);
  res.status(200).json(theRecord);
}
async function jobComments(req, res) {
  const jobId = parseInt(req.params.id);
  let jcomments = await jobs.getUserPosts(jobId, jobcomments.model);
  res.status(200).json(jcomments);
}
async function handleCreate(req, res) {
  let obj = req.body;
  let userId = req.user.id;
  let username = req.user.username;
  obj.user_id = userId;
  obj.company_name = username;
  let newRecord = await jobs.create(obj);
  res.status(201).json(newRecord);
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
  res.status(200).json(deletedRecord);
}

async function jobapplyer(req, res) {
  const jobId = parseInt(req.params.id);
  const job = await jobs.get(jobId);
  if (
    req.user.dataValues.role == "company" &&
    req.user.dataValues.id == job.user_id
  ) {
    let japplyer = await jobs.getJobApplyer(jobId, applyjobCollection.model);
    res.status(200).json(japplyer);
  } else {
    return res.status(200).json("you don't have Permission");
  }
}

module.exports = router2;
