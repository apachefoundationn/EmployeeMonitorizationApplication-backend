const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const CorrectionRequest = sequelize.define(
  "CorrectionRequest",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
  },
  { timestamps: true }
);

User.hasMany(CorrectionRequest, { foreignKey: "employeeId" });
CorrectionRequest.belongsTo(User, { foreignKey: "employeeId" });

module.exports = CorrectionRequest;
