const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roleAccess = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/teamController");

router.use(auth);

router.get("/", roleAccess(["employee", "manager", "admin"]), ctrl.getTeams);
router.post("/", roleAccess(["admin"]), ctrl.createTeam);
router.put("/:id", roleAccess(["admin"]), ctrl.updateTeam);
router.delete("/:id", roleAccess(["admin"]), ctrl.deleteTeam);
router.post("/:id/members", roleAccess(["admin"]), ctrl.addMember);
router.delete("/:id/members/:userId", roleAccess(["admin"]), ctrl.removeMember);
const upload = require("../middleware/uploadMiddleware");

router.post("/:teamId/tasks", roleAccess(["admin"]), upload.array("attachments", 5), ctrl.assignTask);
router.get("/:teamId/tasks", roleAccess(["employee", "manager", "admin"]), ctrl.getTeamTasks);
router.post("/tasks/:taskId/respond", roleAccess(["employee", "manager", "admin"]), upload.array("attachments", 5), ctrl.respondToTask);

module.exports = router;
