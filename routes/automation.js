const router = require("express").Router();

const automationController =
    require("../controllers/automationController");

router.post(
    "/listing/:listingId",
    automationController.updateCompleteListing
);

module.exports = router;