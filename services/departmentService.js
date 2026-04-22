const Department = require("../models/Departments");
const User = require("../models/User");

function normalizeDepartmentName(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function ensureDepartmentExistsByName(name) {
  const normalized = normalizeDepartmentName(name);
  if (!normalized) return null;

  const department = await Department.findOne({ where: { name: normalized } });
  if (!department) {
    const error = new Error("Department not found");
    error.status = 404;
    throw error;
  }

  return department;
}

async function listDepartments() {
  const departments = await Department.findAll({ order: [["name", "ASC"]] });
  return departments.map((department) => department.toJSON());
}

async function getDepartmentById(id) {
  const department = await Department.findByPk(id);
  if (!department) {
    const error = new Error("Department not found");
    error.status = 404;
    throw error;
  }

  return department;
}

async function createDepartment({ name, descr }) {
  const normalizedName = normalizeDepartmentName(name);
  if (!normalizedName) {
    const error = new Error("Department name is required");
    error.status = 400;
    throw error;
  }

  const existing = await Department.findOne({ where: { name: normalizedName } });
  if (existing) {
    const error = new Error("Department already exists");
    error.status = 409;
    throw error;
  }

  return Department.create({ name: normalizedName, descr: descr?.trim() || null });
}

async function updateDepartment(id, { name, descr }) {
  const department = await getDepartmentById(id);
  const nextName = normalizeDepartmentName(name);

  if (!nextName) {
    const error = new Error("Department name is required");
    error.status = 400;
    throw error;
  }

  const duplicate = await Department.findOne({ where: { name: nextName } });
  if (duplicate && duplicate.id !== department.id) {
    const error = new Error("Department already exists");
    error.status = 409;
    throw error;
  }

  const previousName = department.name;
  await department.update({ name: nextName, descr: descr?.trim() || null });

  if (previousName !== nextName) {
    await User.update({ department: nextName }, { where: { department: previousName } });
  }

  return department;
}

async function deleteDepartment(id) {
  const department = await getDepartmentById(id);

  await User.update({ department: null }, { where: { department: department.name } });
  await department.destroy();
}

module.exports = {
  normalizeDepartmentName,
  ensureDepartmentExistsByName,
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
