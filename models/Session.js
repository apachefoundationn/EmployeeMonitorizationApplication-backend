// models/Session.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Session = sequelize.define("Session", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  login_time: { type: DataTypes.DATE },

  logout_time: { type: DataTypes.DATE },

  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

User.hasMany(Session, { foreignKey: "user_id" });
Session.belongsTo(User, { foreignKey: "user_id" });

module.exports = Session;