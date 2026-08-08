const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");
const etsy = require("../config/etsy");

function headers() {
    return {
        Authorization: `Bearer ${etsy.accessToken}`,
        "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`
    };
}

async function getListing(id) {

    const response = await axios.get(
        `https://openapi.etsy.com/v3/application/listings/${id}`,
        {
            headers: headers()
        }
    );

    return response.data;
}

async function getDraftListings() {

    const response = await axios.get(
        `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
        {
            headers: headers(),
            params: {
                state: "draft",
                limit: 100
            }
        }
    );

    return response.data;
}

async function getInactiveListings() {

    const response = await axios.get(
        `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
        {
            headers: headers(),
            params: {
                state: "inactive",
                limit: 100
            }
        }
    );

    return response.data;
}

async function updateListing(id, data) {

    const response = await axios.patch(
        `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${id}`,
        data,
        {
            headers: {
                ...headers(),
                "Content-Type": "application/json"
            }
        }
    );

    return response.data;
}

async function getListingImages(listingId) {

    const response = await axios.get(
        // `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/images`,
        `https://openapi.etsy.com/v3/application/listings/${listingId}/images`,
        {
            headers: headers()
        }
    );

    return response.data;
}

async function deleteListingImage(listingId, imageId) {

    const response = await axios.delete(
        `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/images/${imageId}`,
        {
            headers: headers()
        }
    );

    return response.data;
}
async function deleteAllListingImages(listingId) {

    const images = await getListingImages(listingId);

    for (const image of images.results) {

        await deleteListingImage(
            listingId,
            image.listing_image_id
        );

    }

    return {
        deleted: images.results.length
    };
}

async function uploadFolderImages(listingId, folderPath) {

    if (!fs.existsSync(folderPath)) {
        throw new Error("Folder not found: " + folderPath);
    }

    const files = fs.readdirSync(folderPath)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (files.length === 0) {
        throw new Error("No JPG/PNG images found.");
    }

    const uploaded = [];

    for (let i = 0; i < files.length; i++) {

        const file = files[i];

        const form = new FormData();

        form.append(
            "image",
            fs.createReadStream(path.join(folderPath, file))
        );

        form.append("rank", i + 1);

        const response = await axios.post(
            `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/images`,
            form,
            {
                headers: {
                    ...headers(),
                    ...form.getHeaders()
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );

        uploaded.push({
            file,
            imageId: response.data.listing_image_id,
            rank: response.data.rank
        });

        console.log(`Uploaded ${file}`);
    }

    return {
        uploaded: uploaded.length,
        files: uploaded
    };
}
async function uploadImageFromFolder(listingId, albumFolder, imageNumber) {

    const folderPath = path.join(
        process.env.BASE_MEDIA_PATH,
        albumFolder
    );

    const imagePath = path.join(
        folderPath,
        `${imageNumber}.jpg`
    );

    if (!fs.existsSync(imagePath)) {
        throw new Error(`Image not found: ${imagePath}`);
    }

    const form = new FormData();

    form.append(
        "image",
        fs.createReadStream(imagePath)
    );

    form.append("rank", 1);

    const response = await axios.post(
        `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/images`,
        form,
        {
            headers: {
                ...headers(),
                ...form.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        }
    );

    return response.data;
}
module.exports = {
    headers,
    getListing,
    getDraftListings,
    getInactiveListings,
    updateListing,

    getListingImages,
    deleteListingImage,
    deleteAllListingImages,

    uploadFolderImages,
    uploadImageFromFolder
};