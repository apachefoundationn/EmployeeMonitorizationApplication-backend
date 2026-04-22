const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Team = sequelize.define(
  "Team",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    managerId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { timestamps: true }
);

Team.hasMany(User, { foreignKey: "teamId", as: "members" });
User.belongsTo(Team, { foreignKey: "teamId", as: "team" });
Team.belongsTo(User, { foreignKey: "managerId", as: "manager" });

module.exports = Team;
