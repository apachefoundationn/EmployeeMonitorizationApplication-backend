const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roleAccess = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/userController");


router.get("/", auth, roleAccess(["admin", "manager"]), ctrl.getUsers);
router.get("/options", auth, roleAccess(["admin", "manager"]), ctrl.getUserOptions);
router.post("/", auth, roleAccess("admin"), ctrl.createUser);
router.get("/:id", auth, ctrl.getUser);
router.put("/:id", auth, roleAccess("admin"), ctrl.updateUser);
router.delete("/:id", auth, roleAccess("admin"), ctrl.deleteUser);

module.exports = router;