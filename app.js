const cors = require("cors");
const express = require("express");
const env = require("./config/env");
const app = express();

const corsOptions = {
  origin: env.corsOrigin.split(",").map((item) => item.trim()),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const correctionRoutes = require("./routes/correctionRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const teamRoutes = require("./routes/teamRoutes");

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "employee-monitoring-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/correction-requests", correctionRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/teams", teamRoutes);

module.exports = app;