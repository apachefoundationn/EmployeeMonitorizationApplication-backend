const { Op, fn, col, literal } = require("sequelize");
const XLSX = require("xlsx");
const sequelize = require("../config/database");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

function parseISODateParam(value) {
  if (!value) return null;
  // Expect YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function startOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
}

function endOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function timeToMinutes(d) {
  return d.getHours() * 60 + d.getMinutes();
}

exports.getDashboard = async (req, res) => {
  const dateParam = parseISODateParam(req.query.date);
  const base = dateParam ? dateParam : new Date();
  const from = startOfDayUTC(base);
  const to = endOfDayUTC(base);

  // Exclude admin users from total employee count
  const totalEmployees = await User.count({ where: { role: { [Op.ne]: "admin" } } });

  // Users who have at least one sign-in in the day, excluding admins
  const signedInTodayRaw = await Attendance.findAll({
    attributes: [[col("user_id"), "user_id"]],
    where: {
      sign_in_time: { [Op.between]: [from, to] },
    },
    include: [{ model: User, where: { role: { [Op.ne]: "admin" } }, attributes: [] }],
    group: ["user_id"],
    raw: true,
  });
  const activeToday = signedInTodayRaw.length;

  const absentToday = Math.max(0, totalEmployees - activeToday);

  // Weekly trend scoped to the current week (Monday to Sunday)
  // Calculate start of week (Monday 00:00 UTC)
  const dayOfWeek = base.getUTCDay(); // 0 Sun, 1 Mon, ...
  const diffToMonday = (dayOfWeek + 6) % 7; // days since Monday
  const weekStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - diffToMonday, 0, 0, 0));

  const trend = await Attendance.findAll({
    attributes: [
      [fn("date_trunc", "day", col("sign_in_time")), "day"],
      [fn("count", literal("case when status = 'present' then 1 end")), "present"],
      [fn("count", literal("case when status = 'absent' then 1 end")), "absent"],
    ],
    where: {
      sign_in_time: { [Op.gte]: weekStart },
    },
    group: [fn("date_trunc", "day", col("sign_in_time"))],
    order: [[fn("date_trunc", "day", col("sign_in_time")), "ASC"]],
    raw: true,
  });

  res.json({
    stats: { totalEmployees, activeToday, absentToday },
    trend: trend.map((r) => ({
      day: new Date(r.day).toISOString().slice(0, 10),
      present: Number(r.present || 0),
      absent: Number(r.absent || 0),
    })),
    meta: { date: from.toISOString().slice(0, 10) },
  });
};

exports.getAttendance = async (req, res) => {
  const department = req.query.department && req.query.department !== "all" ? req.query.department : null;
  const dateParam = parseISODateParam(req.query.date);

  const whereAttendance = {};
  if (dateParam) {
    const from = startOfDayUTC(dateParam);
    const to = endOfDayUTC(dateParam);
    whereAttendance.sign_in_time = { [Op.between]: [from, to] };
  }

  const whereUser = {};
  if (department) whereUser.department = department;

  const records = await Attendance.findAll({
    where: whereAttendance,
    include: [
      {
        model: User,
        attributes: ["id", "name", "email", "department", "role"],
        where: whereUser,
        required: true,
      },
    ],
    order: [["sign_in_time", "DESC"]],
  });

  res.json(
    records.map((r) => ({
      id: r.id,
      user: r.User,
      sign_in_time: r.sign_in_time,
      sign_out_time: r.sign_out_time,
      total_hours: r.total_hours,
      status: r.status,
    }))
  );
};

exports.getWeeklyReport = async (req, res) => {
  let end = parseISODateParam(req.query.end);
  let start = parseISODateParam(req.query.start);

  if (!start && !end) {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0));
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday + 6, 23, 59, 59, 999));
  } else {
    end = end || new Date();
    start = start || new Date(end.getTime() - 1000 * 60 * 60 * 24 * 7);
  }

  // Use raw SQL for predictable aggregation in Postgres
  const [rows] = await sequelize.query(
    `
      select
        to_char(date_trunc('day', a.sign_in_time), 'Dy') as label,
        count(*) filter (where a.status = 'present') as present,
        0 as absent
      from "Attendances" a
      where a.sign_in_time between :start and :end
      group by date_trunc('day', a.sign_in_time)
      order by date_trunc('day', a.sign_in_time) asc
    `,
    { replacements: { start: startOfDayUTC(start), end: endOfDayUTC(end) } }
  );

  res.json(
    rows.map((r) => ({
      label: String(r.label).trim(),
      present: Number(r.present || 0),
      absent: Number(r.absent || 0),
    }))
  );
};

exports.getMonthlyReport = async (req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month); // 1-12
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: "year and month (1-12) are required" });
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [rows] = await sequelize.query(
    `
      select
        to_char(date_trunc('week', a.sign_in_time), 'IYYY-"W"IW') as label,
        count(*) filter (where a.status = 'present') as present,
        0 as absent
      from "Attendances" a
      where a.sign_in_time between :start and :end
      group by date_trunc('week', a.sign_in_time)
      order by date_trunc('week', a.sign_in_time) asc
    `,
    { replacements: { start, end } }
  );

  res.json(
    rows.map((r) => ({
      label: String(r.label).trim(),
      present: Number(r.present || 0),
      absent: Number(r.absent || 0),
    }))
  );
};

exports.exportAttendanceXlsx = async (req, res) => {
  const start = parseISODateParam(req.query.start);
  const end = parseISODateParam(req.query.end);
  const department = req.query.department && req.query.department !== "all" ? req.query.department : null;

  const whereAttendance = {};
  if (start && end) {
    whereAttendance.sign_in_time = { [Op.between]: [startOfDayUTC(start), endOfDayUTC(end)] };
  }

  const whereUser = {};
  if (department) whereUser.department = department;

  const records = await Attendance.findAll({
    where: whereAttendance,
    include: [
      {
        model: User,
        attributes: ["id", "name", "email", "department"],
        where: whereUser,
        required: true,
      },
    ],
    order: [["sign_in_time", "DESC"]],
  });

  const rows = records.map((r) => ({
    employee: r.User?.name,
    email: r.User?.email,
    department: r.User?.department,
    check_in: r.sign_in_time ? new Date(r.sign_in_time).toLocaleString() : "",
    check_out: r.sign_out_time ? new Date(r.sign_out_time).toLocaleString() : "",
    status: r.status,
    total_hours: r.total_hours ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.xlsx");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
};

