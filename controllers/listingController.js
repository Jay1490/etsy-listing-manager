const axios = require("axios");
const etsy = require("../config/etsy");
const etsyService = require("../services/etsyService");

exports.createDraft = async (req, res) => {
    try {
        const response = await axios.post(
            `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
            {
                quantity: 999,
                title: "Music Album Blueprint Digital",
                description: "Test listing created by RoninFrames Listing Manager.",
                price: 5.99,
                who_made: "i_did",
                when_made: "2020_2026",
                taxonomy_id: 125,
                type: "download",
                state: "draft"
            },
            {
                headers: {
                    Authorization: `Bearer ${etsy.accessToken}`,
                    "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json(response.data);

    } catch (err) {
        res.status(500).json(
            err.response?.data || err.message
        );
    }
};

exports.getDrafts = async (req, res) => {
    try {
        const response = await axios.get(
            `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
            {
                headers: {
                    Authorization: `Bearer ${etsy.accessToken}`,
                    "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`
                },
                params: {
                    state: "draft",
                    limit: 100
                }
            }
        );

        res.json(response.data);

    } catch (err) {
        res.status(500).json(
            err.response?.data || err.message
        );
    }
};

exports.getMyShop = async (req, res) => {
    try {
        const response = await axios.get(
            "https://openapi.etsy.com/v3/application/users/me",
            {
                headers: {
                    Authorization: `Bearer ${etsy.accessToken}`,
                    "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`
                }
            }
        );

        res.json(response.data);

    } catch (err) {
        res.status(500).json(
            err.response?.data || err.message
        );
    }
};

exports.getListing = async (req, res) => {
    try {
        const listing = await etsyService.getListing(
            req.params.id
        );

        res.json(listing);

    } catch (err) {
        res.status(500).json(
            err.response?.data || err.message
        );
    }
};

exports.updateListing = async (req, res) => {
    try {
        const listing = await etsyService.updateListing(
            req.params.id,
            req.body
        );

        res.json(listing);

    } catch (err) {
        res.status(500).json(
            err.response?.data || err.message
        );
    }
};

exports.getInactive = async (req, res) => {
    try {
        const listings = await etsyService.getInactiveListings();

        res.json(listings);

    } catch (err) {
        res.status(500).json(
            err.response?.data || err.message
        );
    }
};