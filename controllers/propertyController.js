const etsyService = require("../services/etsyService");

exports.getTaxonomyProperties = async (req, res) => {
    try {
        const result =
            await etsyService.getTaxonomyProperties(
                req.params.taxonomyId
            );

        res.json(result);

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
};

exports.getListingProperties = async (req, res) => {
    try {
        const result =
            await etsyService.getListingProperties(
                req.params.listingId
            );

        res.json(result);

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
};

exports.updateListingProperty = async (req, res) => {
    try {
        const result =
            await etsyService.updateListingProperty(
                req.params.listingId,
                req.body.propertyId,
                req.body.valueIds
            );

        res.json({
            success: true,
            result
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
};