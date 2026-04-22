const User = require("../models/User");
const bcrypt = require("bcrypt");
const {
  ensureDepartmentExistsByName,
  normalizeDepartmentName,
} = require("../services/departmentService");

exports.getUsers = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page || "1", 10), 1);
  const limit = Math.max(Number.parseInt(req.query.limit || "10", 10), 1);
  const offset = (page - 1) * limit;
  const where = {};

  if (req.user.role === "manager") {
    const actor = await User.findByPk(req.user.id);
    if (actor?.department) {
      where.department = actor.department;
    }
    where.role = "employee";
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [["id", "DESC"]],
    offset,
    limit,
  });
  res.json({
    items: rows,
    total: count,
    page,
    limit,
    totalPages: Math.max(Math.ceil(count / limit), 1),
  });
};

exports.getUserOptions = async (req, res) => {
  const where = {};

  if (req.user.role === "manager") {
    const actor = await User.findByPk(req.user.id);
    if (actor?.department) {
      where.department = actor.department;
    }
    where.role = "employee";
  }

  const users = await User.findAll({
    where,
    attributes: ["id", "name", "email", "department", "role"],
    order: [["name", "ASC"]],
  });

  res.json(users);
};

exports.getUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

exports.createUser = async (req, res) => {
  const { name, email, password, role = "employee", department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const normalizedDepartment = normalizeDepartmentName(department);
  if (normalizedDepartment) {
    await ensureDepartmentExistsByName(normalizedDepartment);
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    department: normalizedDepartment || null,
    role,
    password_hash: hash,
  });
  res.status(201).json(user);
};

exports.updateUser = async (req, res) => {
  const updates = { ...req.body };
  if ("department" in updates) {
    const normalizedDepartment = normalizeDepartmentName(updates.department);
    if (normalizedDepartment) {
      await ensureDepartmentExistsByName(normalizedDepartment);
    }
    updates.department = normalizedDepartment || null;
  }

  await User.update(updates, { where: { id: req.params.id } });
  res.json({ message: "Updated" });
};

exports.deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role === 'admin') return res.status(403).json({ message: "Cannot delete admin users" });

  await User.destroy({ where: { id: req.params.id } });
  res.json({ message: "Deleted" });
};

