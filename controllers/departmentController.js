const departmentService = require("../services/departmentService");

exports.createDepartment = async (req, res) => {
  try {
    const dept = await departmentService.createDepartment(req.body);
    res.status(201).json(dept);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.getAllDepartments = async (req, res) => {
  try {
    const depts = await departmentService.listDepartments();
    res.status(200).json(depts);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const dept = await departmentService.getDepartmentById(req.params.id);
    res.status(200).json(dept);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const dept = await departmentService.updateDepartment(req.params.id, req.body);
    res.status(200).json(dept);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    await departmentService.deleteDepartment(req.params.id);
    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};