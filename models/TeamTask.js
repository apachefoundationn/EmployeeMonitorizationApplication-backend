const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Team = require("./Team");
const User = require("./User");

const TeamTask = sequelize.define(
  "TeamTask",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    teamId: { type: DataTypes.INTEGER, allowNull: false },
    taskName: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    attachments: { type: DataTypes.TEXT, allowNull: true },
    assignedBy: { type: DataTypes.INTEGER, allowNull: false },
    assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { timestamps: true }
);

Team.hasMany(TeamTask, { foreignKey: "teamId", as: "tasks", onDelete: "CASCADE" });
TeamTask.belongsTo(Team, { foreignKey: "teamId", as: "team" });

User.hasMany(TeamTask, { foreignKey: "assignedBy", as: "assignedTeamTasks" });
TeamTask.belongsTo(User, { foreignKey: "assignedBy", as: "assigner" });

module.exports = TeamTask;
