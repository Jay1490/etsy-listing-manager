const listingAutomationService = require("../services/listingAutomationService");

exports.updateCompleteListing = async (req, res) => {

    try {

        const { listingId } = req.params;

        const result =
            await listingAutomationService.updateCompleteListing(
                listingId,
                req.body
            );

        res.json(result);

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });

    }
};