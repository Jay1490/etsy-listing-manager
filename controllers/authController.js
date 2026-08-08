const axios = require("axios");
const pkceChallenge = require("pkce-challenge").default;

const etsy = require("../config/etsy");

exports.login = async (req, res) => {

    const pkce = await pkceChallenge();

    etsy.verifier = pkce.code_verifier;

    const clientId = process.env.ETSY_KEYSTRING;

    const redirect = encodeURIComponent(
        process.env.REDIRECT_URI
    );

    const scopes = encodeURIComponent(
        "listings_r listings_w shops_r"
    );

    const state = "roninframes";

    const url =
        "https://www.etsy.com/oauth/connect" +
        "?response_type=code" +
        `&redirect_uri=${redirect}` +
        `&scope=${scopes}` +
        `&client_id=${clientId}` +
        `&state=${state}` +
        `&code_challenge=${pkce.code_challenge}` +
        "&code_challenge_method=S256";

    res.redirect(url);

};

exports.callback = async (req, res) => {

    const code = req.query.code;

    if (!code)
        return res.send(req.query);

    try {

        const token = await axios.post(
            "https://api.etsy.com/v3/public/oauth/token",
            {
                grant_type: "authorization_code",
                client_id: process.env.ETSY_KEYSTRING,
                redirect_uri: process.env.REDIRECT_URI,
                code: code,
                code_verifier: etsy.verifier
            }
        );

        etsy.accessToken = token.data.access_token;
        etsy.refreshToken = token.data.refresh_token;

        const me = await axios.get(
            "https://openapi.etsy.com/v3/application/users/me",
            {
                headers: {
                    Authorization: `Bearer ${etsy.accessToken}`,
                    "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`
                }
            }
        );

        etsy.userId = me.data.user_id;
        etsy.shopId = me.data.shop_id;

        console.log("User:", etsy.userId);
        console.log("Shop:", etsy.shopId);

        res.json({
            message: "OAuth Successful",
            access_token: etsy.accessToken
        });

    } catch (err) {

        console.log(err.response?.data);

        res.status(500).json(
            err.response?.data || err.message
        );

    }

};
exports.exportToken = async (req, res) => {

    try {

        const migrationSecret = req.headers["x-migration-secret"];

        if (
            !migrationSecret ||
            migrationSecret !== process.env.TOKEN_MIGRATION_SECRET
        ) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }
        console.log(
            "Migration secret received:",
            !!req.headers["x-migration-secret"]
        );

        console.log(
            "Migration secret configured:",
            !!process.env.TOKEN_MIGRATION_SECRET
        );
        if (!etsy.accessToken || !etsy.refreshToken) {
            return res.status(400).json({
                error: "No Etsy OAuth token found. Login first."
            });
        }

        res.json({
            accessToken: etsy.accessToken,
            refreshToken: etsy.refreshToken,
            userId: etsy.userId,
            shopId: etsy.shopId
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }
};