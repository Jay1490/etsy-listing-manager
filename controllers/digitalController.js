const digitalAutomationService = require("../services/digitalAutomationService");

exports.runDigitalAlbum = async (req, res) => {
    try {
        const result = await digitalAutomationService.runDigitalAlbum(req.body);

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
