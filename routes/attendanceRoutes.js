const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roleAccess = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/attendanceController");

router.post("/sign-in", auth, ctrl.signIn);
router.post("/sign-out", auth, ctrl.signOut);
router.get("/me", auth, ctrl.getMyAttendance);
router.get("/team", auth, roleAccess(["admin"]), ctrl.getTeamAttendance);
router.get("/mepdf", auth, ctrl.getMyAttendanceToPDF);
router.get("/weekly-hours", auth, ctrl.getWeeklyHours);


module.exports = router;