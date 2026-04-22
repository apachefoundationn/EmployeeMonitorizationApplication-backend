const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const TeamTask = require("./TeamTask");
const User = require("./User");

const TeamTaskResponse = sequelize.define(
  "TeamTaskResponse",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    teamTaskId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    attachments: { type: DataTypes.TEXT, allowNull: true },
  },
  { timestamps: true }
);

TeamTask.hasMany(TeamTaskResponse, { foreignKey: "teamTaskId", as: "responses", onDelete: "CASCADE" });
TeamTaskResponse.belongsTo(TeamTask, { foreignKey: "teamTaskId", as: "task" });

User.hasMany(TeamTaskResponse, { foreignKey: "userId", as: "taskResponses" });
TeamTaskResponse.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = TeamTaskResponse;
