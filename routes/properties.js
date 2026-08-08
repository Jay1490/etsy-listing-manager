const router = require("express").Router();

const propertyController =
    require("../controllers/propertyController");

router.get(
    "/taxonomy/:taxonomyId",
    propertyController.getTaxonomyProperties
);

router.get(
    "/listing/:listingId",
    propertyController.getListingProperties
);

router.put(
    "/listing/:listingId",
    propertyController.updateListingProperty
);

module.exports = router;