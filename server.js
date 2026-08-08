require("dotenv").config();

const express = require("express");
const app = express();

const etsy = require("./config/etsy");

if (etsy.accessToken) {
    console.log("Etsy session restored from persisted tokens.");
} else {
    console.log("No persisted Etsy session found - login via /auth/login.");
}

app.use(express.json());

app.get("/", (req, res) => {
    res.send(`
        <h2>RoninFrames Listing Manager</h2>
        <a href="/auth/login">Login with Etsy</a>
    `);
});

app.use("/auth", require("./routes/auth"));
app.use("/listings", require("./routes/listings"));
app.use("/images", require("./routes/images"));
app.use("/files", require("./routes/files"));
app.use("/automation", require("./routes/automation"));
app.use("/digital", require("./routes/digital"));
app.use(
    "/properties",
    require("./routes/properties")
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on ${PORT}`);
});
