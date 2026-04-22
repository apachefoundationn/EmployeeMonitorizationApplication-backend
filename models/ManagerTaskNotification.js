const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Team = require("./Team");
const TeamTask = require("./TeamTask");
const User = require("./User");

const ManagerTaskNotification = sequelize.define(
  "ManagerTaskNotification",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    managerId: { type: DataTypes.INTEGER, allowNull: false },
    teamId: { type: DataTypes.INTEGER, allowNull: false },
    teamTaskId: { type: DataTypes.INTEGER, allowNull: false },
    taskName: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    teamName: { type: DataTypes.STRING, allowNull: false },
    assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["managerId", "teamTaskId"] }],
  }
);

User.hasMany(ManagerTaskNotification, { foreignKey: "managerId", as: "taskNotifications" });
ManagerTaskNotification.belongsTo(User, { foreignKey: "managerId", as: "manager" });

Team.hasMany(ManagerTaskNotification, { foreignKey: "teamId", as: "managerTaskNotifications", onDelete: "CASCADE" });
ManagerTaskNotification.belongsTo(Team, { foreignKey: "teamId", as: "team" });

TeamTask.hasMany(ManagerTaskNotification, { foreignKey: "teamTaskId", as: "managerNotifications", onDelete: "CASCADE" });
ManagerTaskNotification.belongsTo(TeamTask, { foreignKey: "teamTaskId", as: "teamTask" });

module.exports = ManagerTaskNotification;
