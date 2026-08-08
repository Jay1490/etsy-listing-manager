const router = require("express").Router();

const auth = require("../controllers/authController");

router.get("/login", auth.login);
router.get("/callback", auth.callback);

router.post("/export-token", auth.exportToken);

module.exports = router;


// const express = require("express");
// const router = express.Router();

// const axios = require("axios");
// const pkceChallenge = require("pkce-challenge").default;

// const etsy = require("../config/etsy");



// router.get("/my-shop", async (req, res) => {

//     try {

//         const response = await axios.get(
//             "https://openapi.etsy.com/v3/application/users/me",
//             {
//                 headers: {
//                     Authorization: `Bearer ${etsy.accessToken}`,
//                     "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`
//                 }
//             }
//         );

//         res.json(response.data);

//     } catch (err) {

//         console.log(err.response?.data);

//         res.status(500).json(
//             err.response?.data || err.message
//         );

//     }

// });

// module.exports = router;