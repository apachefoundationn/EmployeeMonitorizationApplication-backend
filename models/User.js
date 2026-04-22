// models/User.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  name: { type: DataTypes.STRING, allowNull: false },

  email: { type: DataTypes.STRING, allowNull: false, unique: true },

  password_hash: { type: DataTypes.TEXT, allowNull: false },

  role: {
    type: DataTypes.ENUM("employee", "admin", "manager"),
    defaultValue: "employee",
  },

  department: { type: DataTypes.STRING },
  teamId: { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = User;