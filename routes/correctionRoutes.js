const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roleAccess = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/correctionController");

router.post("/", auth, roleAccess(["employee"]), ctrl.createRequest);
router.get("/", auth, roleAccess(["employee", "admin"]), ctrl.getRequests);
router.patch("/:id/status", auth, roleAccess(["admin"]), ctrl.updateStatus);
router.post("/:id/approve", auth, roleAccess(["admin"]), ctrl.approveRequest);
router.post("/:id/reject", auth, roleAccess(["admin"]), ctrl.rejectRequest);

module.exports = router;
