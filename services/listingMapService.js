const fs = require("fs");
const path = require("path");

const MAP_FILE = path.join(__dirname, "..", "data", "listing-map.json");

function ensureDataDir() {
    const dir = path.dirname(MAP_FILE);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function loadMap() {
    try {
        if (!fs.existsSync(MAP_FILE)) {
            return {};
        }

        return JSON.parse(fs.readFileSync(MAP_FILE, "utf-8"));

    } catch (err) {
        console.error("Failed to read listing map:", err.message);
        return {};
    }
}

function saveMap(map) {
    try {
        ensureDataDir();

        fs.writeFileSync(
            MAP_FILE,
            JSON.stringify(map, null, 2),
            "utf-8"
        );

    } catch (err) {
        console.error("Failed to write listing map:", err.message);
    }
}

function getEntry(key) {
    const map = loadMap();
    return map[key] || null;
}

function setEntry(key, data) {
    const map = loadMap();

    map[key] = {
        ...(map[key] || {}),
        ...data,
        updatedAt: new Date().toISOString()
    };

    saveMap(map);

    return map[key];
}

module.exports = {
    MAP_FILE,
    loadMap,
    getEntry,
    setEntry
};
