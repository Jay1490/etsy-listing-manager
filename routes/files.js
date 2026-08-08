const router = require("express").Router();

const fileController = require("../controllers/fileController");

router.post(
    "/:listingId/upload",
    fileController.uploadListingFile
);
router.post(
    "/:listingId/replace",
    fileController.replaceListingFile
);
module.exports = router;