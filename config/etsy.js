const tokenStore = require("./tokenStore");

let tokens = tokenStore.loadTokens();

// First run on a fresh machine: no local token file yet. If you pasted
// tokens into .env (copied from your Render deployment), seed the local
// file from there so you never have to redo the OAuth flow locally.
if (!tokens) {
    const seeded = tokenStore.seedFromEnv();

    if (seeded) {
        tokenStore.saveTokens(seeded);
        tokens = seeded;
        console.log("Etsy tokens seeded from .env into local token store.");
    }
}

module.exports = {
    accessToken: tokens?.accessToken || "",
    refreshToken:
        tokens?.refreshToken ||
        process.env.ETSY_REFRESH_TOKEN ||
        "",
    // epoch ms when accessToken expires. 0 = unknown/never fetched.
    expiresAt: tokens?.expiresAt || 0,
    userId: tokens?.userId || process.env.ETSY_USER_ID || "",
    shopId: tokens?.shopId || process.env.ETSY_SHOP_ID || "",
    verifier: ""
};
