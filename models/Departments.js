const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Department = sequelize.define(
  "Department",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descr: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "departments", // matches your DB table
    timestamps: false, // since your table has no createdAt/updatedAt
  }
);

module.exports = Department;