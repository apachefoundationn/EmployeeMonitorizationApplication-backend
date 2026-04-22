const XLSX = require('xlsx');
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { calculateHours } = require("../services/attendanceService");

exports.signIn = async (req, res) => {
  const existing = await Attendance.findOne({
    where: { user_id: req.user.id, sign_out_time: null },
  });

  if (existing)
    return res.status(400).json({ message: "Already signed in" });

  const now = new Date();

  const record = await Attendance.create({
    user_id: req.user.id,
    sign_in_time: now,
    status: "present",
  });

  res.json(record);
};

exports.signOut = async (req, res) => {
  const record = await Attendance.findOne({
    where: { user_id: req.user.id, sign_out_time: null },
  });

  if (!record)
    return res.status(400).json({ message: "Not signed in" });

  record.sign_out_time = new Date();
  record.total_hours = calculateHours(
    record.sign_in_time,
    record.sign_out_time
  );

  await record.save();

  res.json(record);
};

exports.getMyAttendance = async (req, res) => {
  const records = await Attendance.findAll({
    where: { user_id: req.user.id },
    order: [["sign_in_time", "DESC"]],
  });
  
  res.json(records);
};

exports.getTeamAttendance = async (req, res) => {
  const records = await Attendance.findAll({
    include: [
      {
        model: User,
        attributes: ["id", "name", "email", "department", "role"],
        required: true,
      },
    ],
    order: [["sign_in_time", "DESC"]],
    limit: 200,
  });
  res.json(
    records.map((r) => ({
      id: r.id,
      user: r.User,
      sign_in_time: r.sign_in_time,
      sign_out_time: r.sign_out_time,
      status: r.status,
      total_hours: r.total_hours,
    }))
  );
};

exports.getMyAttendanceToPDF = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const user_name = user.name;
    const records = await Attendance.findAll({
      where: { user_id: req.user.id },
    });

    // 🧠 Format date
    const formatDate = (iso) =>
      iso ? new Date(iso).toLocaleString() : "";

    // 📊 Convert records → rows
    const rows = records.map((r, i) => ([
      i + 1,
      formatDate(r.sign_in_time),
      formatDate(r.sign_out_time),
      r.status,
      r.total_hours,
    ]));

    // 📄 Final sheet structure
    const data = [
      [`Details of User: ${user_name}`],
      [],
      ["SNo", "Check In", "Check Out", "Status", "Work Hours"],
      ...rows,
    ];

    // 📑 Create sheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // 🧾 Write to buffer (instead of file)
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // 📥 Send as download
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export attendance" });
  }
};

exports.getWeeklyHours = async (req, res) => {
  const { Op } = require("sequelize");
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0));

  const records = await Attendance.findAll({
    where: {
      user_id: req.user.id,
      sign_in_time: {
        [Op.gte]: monday,
      },
    },
  });

  const totalWeeklyHours = records.reduce((sum, r) => sum + (Number(r.total_hours) || 0), 0);
  res.json({ totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100 });
};