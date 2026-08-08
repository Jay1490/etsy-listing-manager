const router = require("express").Router();

const digitalController = require("../controllers/digitalController");

router.post("/album", digitalController.runDigitalAlbum);

module.exports = router;
