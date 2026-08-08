const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");

const etsy = require("../config/etsy");
const tokenStore = require("../config/tokenStore");

const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before actual expiry

function headers() {
    return {
        Authorization: `Bearer ${etsy.accessToken}`,
        "x-api-key": `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_CLIENT_SECRET}`
    };
}

/* =========================
   AUTH
========================= */
async function refreshAccessToken() {
    if (!etsy.refreshToken) {
        throw new Error(
            "No Etsy refresh token available. Log in via /auth/login."
        );
    }

    const params = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.ETSY_KEYSTRING,
        refresh_token: etsy.refreshToken
    });

    const response = await axios.post(
        "https://api.etsy.com/v3/public/oauth/token",
        params.toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    etsy.accessToken = response.data.access_token;

    if (response.data.refresh_token) {
        etsy.refreshToken = response.data.refresh_token;
    }

    etsy.expiresAt = Date.now() + (response.data.expires_in * 1000);

    tokenStore.persist(etsy);

    return etsy.accessToken;
}

async function getValidAccessToken() {
    const isExpiredOrUnknown =
        !etsy.accessToken ||
        !etsy.expiresAt ||
        Date.now() >= etsy.expiresAt - EXPIRY_BUFFER_MS;

    if (isExpiredOrUnknown) {
        await refreshAccessToken();
    }

    return etsy.accessToken;
}

// Wraps a raw axios request config with current auth headers, and retries
// once (after a forced refresh) if Etsy responds with 401.
async function authorizedRequest(config) {
    try {
        return await axios.request({
            ...config,
            headers: {
                ...headers(),
                ...(config.headers || {})
            }
        });

    } catch (err) {
        if (err.response && err.response.status === 401) {
            await refreshAccessToken();

            return await axios.request({
                ...config,
                headers: {
                    ...headers(),
                    ...(config.headers || {})
                }
            });
        }

        throw err;
    }
}

/* =========================
   LISTINGS
========================= */

async function getListing(listingId) {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "get",
        url: `https://openapi.etsy.com/v3/application/listings/${listingId}`
    });

    return response.data;
}

async function getDraftListings() {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "get",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
        params: {
            state: "draft",
            limit: 100
        }
    });

    return response.data;
}

async function getInactiveListings() {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "get",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
        params: {
            state: "inactive",
            limit: 100
        }
    });

    return response.data;
}

async function updateListing(listingId, data) {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "patch",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}`,
        data,
        headers: {
            "Content-Type": "application/json"
        }
    });

    return response.data;
}

/* =========================
   LISTING PROPERTIES
========================= */

async function getTaxonomyProperties(taxonomyId) {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "get",
        url: `https://openapi.etsy.com/v3/application/seller-taxonomy/nodes/${taxonomyId}/properties`
    });

    return response.data;
}

async function getListingProperties(listingId) {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "get",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/properties`
    });

    return response.data;
}

async function updateListingProperty(
    listingId,
    propertyId,
    valueIds,
    values
) {
    await getValidAccessToken();

    if (!Array.isArray(valueIds) || valueIds.length === 0) {
        throw new Error(
            `No value IDs provided for property ${propertyId}`
        );
    }

    if (!Array.isArray(values) || values.length !== valueIds.length) {
        throw new Error(
            `Value IDs and values must have the same length for property ${propertyId}`
        );
    }

    const params = new URLSearchParams();

    params.append("value_ids", valueIds.join(","));
    params.append("values", values.join(","));

    const response = await authorizedRequest({
        method: "put",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/properties/${propertyId}`,
        data: params.toString(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    return response.data;
}

/* =========================
   LISTING IMAGES
========================= */

async function getListingImages(listingId) {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "get",
        url: `https://openapi.etsy.com/v3/application/listings/${listingId}/images`
    });

    return response.data;
}

async function deleteListingImage(listingId, imageId) {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "delete",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/images/${imageId}`
    });

    return response.data;
}

async function deleteAllListingImages(listingId) {
    const images = await getListingImages(listingId);

    for (const image of images.results || []) {
        await deleteListingImage(
            listingId,
            image.listing_image_id
        );
    }

    return {
        deleted: (images.results || []).length
    };
}

async function uploadFolderImages(listingId, folderPath) {
    await getValidAccessToken();

    if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder not found: ${folderPath}`);
    }

    const files = fs.readdirSync(folderPath)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
        .sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );

    if (files.length === 0) {
        throw new Error("No JPG/PNG images found.");
    }

    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const form = new FormData();

        form.append(
            "image",
            fs.createReadStream(
                path.join(folderPath, file)
            )
        );

        form.append("rank", i + 1);

        const response = await authorizedRequest({
            method: "post",
            url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/images`,
            data: form,
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        uploaded.push({
            file,
            imageId: response.data.listing_image_id,
            rank: response.data.rank
        });
    }

    return {
        uploaded: uploaded.length,
        files: uploaded
    };
}

async function uploadImageFromFolder(
    listingId,
    albumFolder,
    imageNumber,
    rank
) {
    await getValidAccessToken();

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

    form.append("rank", rank);

    const response = await authorizedRequest({
        method: "post",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/images`,
        data: form,
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });

    return response.data;
}

async function replaceListingImages(
    listingId,
    albumFolder,
    imageNumbers
) {
    await getValidAccessToken();

    if (
        !Array.isArray(imageNumbers) ||
        imageNumbers.length === 0
    ) {
        throw new Error(
            "At least one image number is required."
        );
    }

    const folderPath = path.join(
        process.env.BASE_MEDIA_PATH,
        albumFolder
    );

    if (!fs.existsSync(folderPath)) {
        throw new Error(
            `Folder not found: ${folderPath}`
        );
    }

    const filesToUpload = imageNumbers.map(
        imageNumber => {
            const imagePath = path.join(
                folderPath,
                `${imageNumber}.jpg`
            );

            if (!fs.existsSync(imagePath)) {
                throw new Error(
                    `Image not found: ${imagePath}`
                );
            }

            return {
                imageNumber,
                imagePath
            };
        }
    );

    const oldImages =
        await getListingImages(listingId);

    const uploaded = [];

    for (
        let i = 0;
        i < filesToUpload.length;
        i++
    ) {
        const item = filesToUpload[i];

        const result =
            await uploadImageFromFolder(
                listingId,
                albumFolder,
                item.imageNumber,
                i + 1
            );

        uploaded.push({
            imageNumber: item.imageNumber,
            listingImageId:
                result.listing_image_id,
            rank: result.rank
        });
    }

    const deleted = [];

    for (const image of oldImages.results || []) {
        await deleteListingImage(
            listingId,
            image.listing_image_id
        );

        deleted.push(
            image.listing_image_id
        );
    }

    return {
        success: true,
        uploaded,
        deleted
    };
}

// Deletes whatever images currently exist on the listing, then uploads every
// jpg/png found directly inside folderPath (sorted so file order = rank order).
// Used by the digital-album automation so re-running the same album never
// duplicates images.
async function replaceListingImagesFromFolder(listingId, folderPath) {
    await getValidAccessToken();

    if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder not found: ${folderPath}`);
    }

    const files = fs.readdirSync(folderPath)
        .filter(file => /\.(jpe?g|png)$/i.test(file))
        .sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );

    if (files.length === 0) {
        throw new Error(`No JPG/PNG images found in: ${folderPath}`);
    }

    const oldImages = await getListingImages(listingId);

    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
        const form = new FormData();

        form.append(
            "image",
            fs.createReadStream(path.join(folderPath, files[i]))
        );
        form.append("rank", i + 1);

        const response = await authorizedRequest({
            method: "post",
            url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/images`,
            data: form,
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        uploaded.push({
            file: files[i],
            imageId: response.data.listing_image_id,
            rank: response.data.rank
        });
    }

    const deleted = [];

    for (const image of oldImages.results || []) {
        await deleteListingImage(listingId, image.listing_image_id);
        deleted.push(image.listing_image_id);
    }

    return { uploaded, deleted };
}

async function createListing(data) {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "post",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings`,
        data,
        headers: {
            "Content-Type": "application/json"
        }
    });

    return response.data;
}

/* =========================
   LISTING FILES / PDF
========================= */

async function getListingFiles(listingId) {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "get",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/files`
    });

    return response.data;
}

async function deleteListingFile(
    listingId,
    fileId
) {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "delete",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/files/${fileId}`
    });

    return response.data;
}

async function uploadListingFile(
    listingId,
    artistFolder,
    pdfName
) {
    await getValidAccessToken();

    const pdfPath = path.join(
        process.env.PDF_MEDIA_PATH,
        artistFolder,
        pdfName
    );

    if (!fs.existsSync(pdfPath)) {
        throw new Error(
            `PDF not found: ${pdfPath}`
        );
    }

    const form = new FormData();

    form.append(
        "file",
        fs.createReadStream(pdfPath)
    );

    form.append("name", pdfName);
    form.append("rank", 1);

    const response = await authorizedRequest({
        method: "post",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/files`,
        data: form,
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });

    return response.data;
}

async function replaceListingFile(
    listingId,
    artistFolder,
    pdfName
) {
    await getValidAccessToken();

    const pdfPath = path.join(
        process.env.PDF_MEDIA_PATH,
        artistFolder,
        pdfName
    );

    if (!fs.existsSync(pdfPath)) {
        throw new Error(
            `PDF not found: ${pdfPath}`
        );
    }

    const existingFiles =
        await getListingFiles(listingId);

    for (const file of existingFiles.results || []) {
        await deleteListingFile(
            listingId,
            file.listing_file_id
        );
    }

    return await uploadListingFile(
        listingId,
        artistFolder,
        pdfName
    );
}

// Same as replaceListingFile, but takes the full path to the PDF directly
// instead of building it from PDF_MEDIA_PATH/artistFolder/pdfName. Used by
// the digital-album automation where the PDF lives inside the album folder.
async function replaceListingFileDirect(listingId, pdfPath, displayName) {
    await getValidAccessToken();

    if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF not found: ${pdfPath}`);
    }

    const existingFiles = await getListingFiles(listingId);

    for (const file of existingFiles.results || []) {
        await deleteListingFile(listingId, file.listing_file_id);
    }

    const form = new FormData();

    form.append("file", fs.createReadStream(pdfPath));
    form.append("name", displayName || path.basename(pdfPath));
    form.append("rank", 1);

    const response = await authorizedRequest({
        method: "post",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/listings/${listingId}/files`,
        data: form,
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });

    return response.data;
}

async function getShopSections() {
    await getValidAccessToken();

    const response = await authorizedRequest({
        method: "get",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/sections`
    });

    return response.data;
}

async function createShopSection(title) {
    await getValidAccessToken();

    const params = new URLSearchParams();

    params.append("title", title);

    const response = await authorizedRequest({
        method: "post",
        url: `https://openapi.etsy.com/v3/application/shops/${etsy.shopId}/sections`,
        data: params.toString(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    return response.data;
}

async function getOrCreateShopSection(title) {
    const sections = await getShopSections();

    const existing = (sections.results || []).find(
        section =>
            section.title.trim().toLowerCase() ===
            title.trim().toLowerCase()
    );

    if (existing) {
        return existing;
    }

    return await createShopSection(title);
}

/* =========================
   EXPORTS
========================= */

module.exports = {
    headers,

    getValidAccessToken,
    refreshAccessToken,

    getListing,
    getDraftListings,
    getInactiveListings,
    createListing,
    updateListing,

    getTaxonomyProperties,
    getListingProperties,
    updateListingProperty,

    getShopSections,
    createShopSection,
    getOrCreateShopSection,

    getListingImages,
    deleteListingImage,
    deleteAllListingImages,

    uploadFolderImages,
    uploadImageFromFolder,
    replaceListingImages,
    replaceListingImagesFromFolder,

    getListingFiles,
    deleteListingFile,
    uploadListingFile,
    replaceListingFile,
    replaceListingFileDirect
};
