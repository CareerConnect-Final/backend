const employeeUserModel = (sequelize, DataTypes) => {
  const model = sequelize.define("employee_user", {
    // Define any additional columns if necessary
  });

  return model;
};

module.exports = employeeUserModel;
