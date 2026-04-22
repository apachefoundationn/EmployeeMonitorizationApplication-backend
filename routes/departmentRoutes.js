const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const roleAccess = require("../middleware/roleMiddleware");
const deptController = require("../controllers/departmentController");

router.get("/", auth, deptController.getAllDepartments);
router.get("/:id", auth, deptController.getDepartmentById);
router.post("/", auth, roleAccess("admin"), deptController.createDepartment);
router.put("/:id", auth, roleAccess("admin"), deptController.updateDepartment);
router.delete("/:id", auth, roleAccess("admin"), deptController.deleteDepartment);

module.exports = router;