"use strict";
//-------------------------------------------------------------------------------- cv table aljamal
const CV = (sequelize, DataTypes) =>
  sequelize.define("CV ", {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    cv_link: { type: DataTypes.STRING },
    full_name: { type: DataTypes.STRING, allowNull: false },
    job_title: { type: DataTypes.STRING },
    job_field: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    phone_number: { type: DataTypes.INTEGER }, //, allowNull: false
    email: { type: DataTypes.STRING }, //, allowNull: false
    summary: { type: DataTypes.STRING }, //, allowNull: false
    // education1: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
    education: { type: DataTypes.STRING }, //, allowNull: false
    work_experience: { type: DataTypes.STRING }, //, allowNull: false
    skills: { type: DataTypes.STRING }, //, allowNull: false
    projects: { type: DataTypes.STRING }, //, allowNull: false
    awards: { type: DataTypes.STRING }, //, allowNull: false
    languages: { type: DataTypes.STRING }, //, allowNull: false
    references: { type: DataTypes.STRING }, //, allowNull: false
    interests_hobbies: { type: DataTypes.STRING }, //, allowNull: false
    linkedin_profile: { type: DataTypes.STRING }, //, allowNull: false
    github_profile: { type: DataTypes.STRING }, //, allowNull: false
  });

module.exports = CV;
//-------------------------------------------------------------------------------- cv table aljamal
