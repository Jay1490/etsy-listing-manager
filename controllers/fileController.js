const etsyService = require("../services/etsyService");

exports.uploadListingFile = async (req, res) => {
    try {
        const { listingId } = req.params;

        const {
            artistFolder,
            pdfName
        } = req.body;

        const result = await etsyService.uploadListingFile(
            listingId,
            artistFolder,
            pdfName
        );

        res.json({
            success: true,
            file: result
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
};
exports.replaceListingFile = async (req, res) => {
    try {
        const { listingId } = req.params;
        const {
            artistFolder,
            pdfName
        } = req.body;

        const result = await etsyService.replaceListingFile(
            listingId,
            artistFolder,
            pdfName
        );

        res.json({
            success: true,
            file: result
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
};