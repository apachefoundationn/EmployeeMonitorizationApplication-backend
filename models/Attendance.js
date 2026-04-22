// models/Attendance.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Attendance = sequelize.define("Attendance", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  sign_in_time: { type: DataTypes.DATE, allowNull: false },

  sign_out_time: { type: DataTypes.DATE },

  total_hours: { type: DataTypes.FLOAT },

  status: {
    type: DataTypes.STRING,
    defaultValue: "present",
  },
});

User.hasMany(Attendance, { foreignKey: "user_id" });
Attendance.belongsTo(User, { foreignKey: "user_id" });

module.exports = Attendance;