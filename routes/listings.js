const router = require("express").Router();

const listing = require("../controllers/listingController");

router.get("/drafts", listing.getDrafts);

router.get("/inactive", listing.getInactive);

router.get("/create", listing.createDraft);

router.get("/:id", listing.getListing);

router.patch("/:id", listing.updateListing);

module.exports = router;