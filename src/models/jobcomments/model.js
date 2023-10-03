'use strict'

const { DataTypes } = require("sequelize")

const jobComments=(sequelize,DataTypes) =>
sequelize.define("jobcomments",{
    content:{
        type:DataTypes.STRING
    },
    user_id:{
        type:DataTypes.INTEGER
    },
    username:{type:DataTypes.STRING},
    profilePicture:{type:DataTypes.STRING},
    job_id:{
        type:DataTypes.INTEGER
    }

})

module.exports= jobComments