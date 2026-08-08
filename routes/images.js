const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");

router.get("/:listingId/images", imageController.getListingImages);
router.delete(
    "/:listingId/images/:imageId",
    imageController.deleteListingImage
);
router.delete(
    "/:listingId/all",
    imageController.deleteAllListingImages
);
router.post(
    "/:listingId/upload-folder",
    imageController.uploadFolderImages
);
router.post(
    "/:listingId/upload-image",
    imageController.uploadImageFromFolder
);
module.exports = router;