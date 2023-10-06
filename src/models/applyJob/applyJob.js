"use strict";
//-------------------------------------------------------------------------------- applyJob table aljamal
const applyJobModel = (sequelize, DataTypes) =>
  sequelize.define("applyJob ", {
    job_id: { type: DataTypes.INTEGER },
    applyer_id: { type: DataTypes.INTEGER },
    company_name: { type: DataTypes.STRING },
    cv_link: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.ENUM("pending", "rejected", "interview"),
      defaultValue: "pending",
    },
    interviewDate: { type: DataTypes.STRING ,defaultValue: "not specified" },
    interviewLocation: { type: DataTypes.STRING ,defaultValue: "not specified"},
    rejectionReason: { type: DataTypes.STRING ,defaultValue: "not specified"},
  });

module.exports = applyJobModel;
//-------------------------------------------------------------------------------- applyJob table aljamal
