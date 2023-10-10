"use strict";

const JobsModel = (sequelize, DataTypes) =>
  sequelize.define("jobs", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    company_name: { type: DataTypes.STRING },
    profilePicture:{type:DataTypes.TEXT},
    job_title: {
      type: DataTypes.STRING(255),
      set(value) {
        this.setDataValue("job_title", value.toUpperCase());
      },
    },
    job_city: {
      type: DataTypes.STRING(255),
      set(value) {
        this.setDataValue("job_city", value.toUpperCase());
      },
    },
    job_field: {
      type: DataTypes.STRING(255),
    },
    content: {
      type: DataTypes.STRING(255),
    },
  });

module.exports = JobsModel;
