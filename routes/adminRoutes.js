const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roleAccess = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/adminController");

router.get("/dashboard", auth, roleAccess("admin"), ctrl.getDashboard);
router.get("/attendance", auth, roleAccess("admin"), ctrl.getAttendance);
router.get("/reports/weekly", auth, roleAccess("admin"), ctrl.getWeeklyReport);
router.get("/reports/monthly", auth, roleAccess("admin"), ctrl.getMonthlyReport);
router.get("/reports/export", auth, roleAccess("admin"), ctrl.exportAttendanceXlsx);

module.exports = router;

