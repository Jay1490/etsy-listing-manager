module.exports = {
    accessToken: "",
    refreshToken: process.env.ETSY_REFRESH_TOKEN || "",
    userId: process.env.ETSY_USER_ID || "",
    shopId: process.env.ETSY_SHOP_ID || "",
    verifier: ""
};