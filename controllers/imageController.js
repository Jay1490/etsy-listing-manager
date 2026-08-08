const etsyService = require("../services/etsyService");

exports.getListingImages = async (req, res) => {
    try {

        const images = await etsyService.getListingImages(
            req.params.listingId
        );

        res.json(images);

    } catch (err) {

        console.error(err.response?.data || err.message);

        res.status(500).json({
            error: err.response?.data || err.message
        });

    }
};

exports.deleteListingImage = async (req, res) => {

    try {

        const { listingId, imageId } = req.params;

        const result = await etsyService.deleteListingImage(
            listingId,
            imageId
        );

        res.json({
            success: true,
            result
        });

    } catch (err) {

        console.error(err.response?.data || err.message);

        res.status(500).json({
            error: err.response?.data || err.message
        });

    }

};

exports.deleteAllListingImages = async (req, res) => {

    try {

        const result = await etsyService.deleteAllListingImages(
            req.params.listingId
        );

        res.json({
            success: true,
            ...result
        });

    } catch (err) {

        console.error(err.response?.data || err.message);

        res.status(500).json({
            error: err.response?.data || err.message
        });

    }

};
exports.uploadFolderImages = async (req, res) => {

    try {

        const { listingId } = req.params;
        const { folderPath } = req.body;

        const result = await etsyService.uploadFolderImages(
            listingId,
            folderPath
        );

        res.json({
            success: true,
            ...result
        });

    } catch (err) {

        console.error(err.response?.data || err.message);

        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });

    }

};

exports.uploadImageFromFolder = async (req, res) => {

    try {

        const { listingId } = req.params;

        const {
            albumFolder,
            imageNumber
        } = req.body;

        const result = await etsyService.uploadImageFromFolder(
            listingId,
            albumFolder,
            imageNumber
        );

        res.json({
            success: true,
            image: result
        });

    } catch (err) {

        console.error(err.response?.data || err.message);

        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });

    }
};