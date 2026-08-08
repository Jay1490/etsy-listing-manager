const fs = require("fs");
const path = require("path");

const TOKEN_FILE = path.join(__dirname, "..", "data", "etsy-tokens.json");

function ensureDataDir() {
    const dir = path.dirname(TOKEN_FILE);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function loadTokens() {
    try {
        if (!fs.existsSync(TOKEN_FILE)) {
            return null;
        }

        const raw = fs.readFileSync(TOKEN_FILE, "utf-8");

        return JSON.parse(raw);

    } catch (err) {
        console.error("Failed to read token store:", err.message);
        return null;
    }
}

function saveTokens(tokens) {
    try {
        ensureDataDir();

        fs.writeFileSync(
            TOKEN_FILE,
            JSON.stringify(tokens, null, 2),
            "utf-8"
        );

    } catch (err) {
        console.error("Failed to write token store:", err.message);
    }
}

// Convenience: persist whatever is currently on the shared etsy config object
function persist(etsy) {
    saveTokens({
        accessToken: etsy.accessToken || "",
        refreshToken: etsy.refreshToken || "",
        expiresAt: etsy.expiresAt || 0,
        userId: etsy.userId || "",
        shopId: etsy.shopId || ""
    });
}

// Used ONLY when no local token file exists yet - lets you paste tokens
// (copied from a Render deployment, via /auth/export-token) into your local
// .env once, and the app takes it from there.
function seedFromEnv() {
    const hasAny =
        process.env.ETSY_ACCESS_TOKEN || process.env.ETSY_REFRESH_TOKEN;

    if (!hasAny) {
        return null;
    }

    return {
        accessToken: process.env.ETSY_ACCESS_TOKEN || "",
        refreshToken: process.env.ETSY_REFRESH_TOKEN || "",
        // if you don't know the exact expiry, leave ETSY_EXPIRES_AT unset -
        // it defaults to 0, which forces an immediate refresh on first use,
        // which is always safe as long as the refresh token is valid.
        expiresAt: process.env.ETSY_EXPIRES_AT
            ? Number(process.env.ETSY_EXPIRES_AT)
            : 0,
        userId: process.env.ETSY_USER_ID || "",
        shopId: process.env.ETSY_SHOP_ID || ""
    };
}

function clearTokens() {
    try {
        if (fs.existsSync(TOKEN_FILE)) {
            fs.unlinkSync(TOKEN_FILE);
        }
    } catch (err) {
        console.error("Failed to clear token store:", err.message);
    }
}

module.exports = {
    TOKEN_FILE,
    loadTokens,
    saveTokens,
    persist,
    seedFromEnv,
    clearTokens
};
