const router = require("express").Router();

const auth = require("../controllers/authController");

router.get("/login", auth.login);

router.get("/callback", auth.callback);

router.post("/export-token", auth.exportToken);

module.exports = router;