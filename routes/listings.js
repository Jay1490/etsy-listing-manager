const router = require("express").Router();

const listing = require("../controllers/listingController");

router.get("/drafts", listing.getDrafts);

router.get("/inactive", listing.getInactive);

router.get("/create", listing.createDraft);

router.get("/:id", listing.getListing);
router.patch("/:id", listing.updateListing);
module.exports = router;



// const express = require("express");
// const etsyService = require("../services/etsyService");
// const router = express.Router();

// const axios = require("axios");

// const etsy = require("../config/etsy");

// router.get("/create-draft", async (req, res) => {

//     try {

//         const response = await axios.post(
//             `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
//             {
//                 quantity: 999,
//                 title: "Music Album Blueprint Digital",
//                 description: "Test listing created by RoninFrames Listing Manager.",
//                 price: 5.99,
//                 who_made: "i_did",
//                 when_made: "2020_2026",
//                 taxonomy_id: 125,
//                 type: "download",
//                 state: "draft"
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${etsy.accessToken}`,
//                     "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`,
//                     "Content-Type": "application/json"
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

// router.get("/draft-listings", async (req, res) => {

//     try {

//         const response = await axios.get(
//             `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${etsy.accessToken}`,
//                     "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`
//                 },
//                 params: {
//                     state: "draft",
//                     limit: 100
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

// router.get("/inactive-listings", async (req, res) => {

//     try {

//         const response = await axios.get(
//             `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${etsy.accessToken}`,
//                     "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`
//                 },
//                 params: {
//                     state: "inactive",
//                     limit: 100
//                 }
//             }
//         );

//         res.json(response.data);

//     } catch (err) {

//         console.log(err.response?.data);
//         res.status(500).json(err.response?.data || err.message);

//     }

// });
// router.get("/inactive-listings", async (req, res) => {

//     try {

//         const listings = await etsyService.getInactiveListings();

//         res.json(listings);

//     } catch (err) {

//         console.log(err.response?.data || err);

//         res.status(500).json(
//             err.response?.data || err.message
//         );

//     }

// });
// router.get("/next-inactive", async (req, res) => {

//     try {

//         const listings = await etsyService.getInactiveListings();

//         if (listings.length === 0) {

//             return res.json({
//                 message: "No inactive listings found."
//             });

//         }

//         res.json(listings[0]);

//     } catch (err) {

//         console.log(err.response?.data || err);

//         res.status(500).json(
//             err.response?.data || err.message
//         );

//     }

// });
// router.get("/listing/:id", async (req, res) => {

//     try {

//         const listing = await etsyService.getListing(req.params.id);

//         res.json(listing);

//     } catch (err) {

//         console.log(err.response?.data || err);

//         res.status(500).json(
//             err.response?.data || err.message
//         );

//     }

// });

// router.post("/edit-listing/:listingId", async (req, res) => {

//     const listingId = req.params.listingId;

//     try {

//         const response = await axios.patch(
//             `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}`,
//             {
//                 title: "Edited Test Listing",
//                 description: "This listing has been edited by RoninFrames.",
//                 state: "draft"
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${etsy.accessToken}`,
//                     "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         );

//         res.json(response.data);

//     } catch (err) {

//         console.log(err.response?.data);

//         res.status(500).json(err.response?.data || err.message);

//     }

// });

// module.exports = router;