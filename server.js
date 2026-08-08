require("dotenv").config();

const express = require("express");
const app = express();

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on ${PORT}`);
});