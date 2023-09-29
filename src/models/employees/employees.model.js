const employees = (sequelize, DataTypes) => {
  return sequelize.define("employees", {
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
};

module.exports = employees;
