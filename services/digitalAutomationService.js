const etsyService = require("./etsyService");
const listingMapService = require("./listingMapService");

async function applyProperties(listingId, properties = []) {
    const results = [];

    for (const property of properties) {
        results.push({
            propertyId: property.propertyId,
            valueIds: property.valueIds,
            result: await etsyService.updateListingProperty(
                listingId,
                property.propertyId,
                property.valueIds,
                property.values
            )
        });
    }

    return results;
}

/**
 * Create-or-update a digital album listing from an explicit payload.
 *
 * Request body shape:
 * {
 *   "mapKey": "KendrickLamar_Section80",   // optional - defaults to images.albumFolder
 *   "section": "Digital Album",            // optional - created if it doesn't exist yet
 *   "listing": {
 *     "title": "...",
 *     "description": "...",
 *     "price": 8.99,
 *     "quantity": 999,
 *     "tags": [...],
 *     "materials": [...],
 *     "who_made": "i_did",
 *     "when_made": "2020_2026",
 *     "is_supply": false,
 *     "type": "download",
 *     "taxonomy_id": 125
 *   },
 *   "properties": [ { propertyId, valueIds, values } ],   // optional
 *   "images": { "albumFolder": "...", "numbers": [1,2,4,6,7] },
 *   "pdf": { "artistFolder": "...", "fileName": "...pdf" }
 * }
 *
 * First run for a given mapKey -> creates a new draft listing.
 * Every run after that -> reuses the same listing (no duplicates), just updates it.
 */
async function runDigitalAlbum(input) {
    const { listing, properties, images, pdf, section } = input;

    if (!listing || !listing.title) {
        throw new Error("listing.title is required");
    }

    const mapKey = input.mapKey || images?.albumFolder;

    if (!mapKey) {
        throw new Error(
            "Provide mapKey, or images.albumFolder so it can be used as the key"
        );
    }

    let entry = listingMapService.getEntry(mapKey);
    let listingId = entry?.listingId;

    const summary = { mapKey, steps: {} };

    try {
        // 1. Create the listing on first run, or update it on every re-run
        if (!listingId) {
            const created = await etsyService.createListing({
                quantity: listing.quantity ?? 999,
                title: listing.title,
                description: listing.description || "",
                price: listing.price,
                who_made: listing.who_made || "i_did",
                when_made: listing.when_made || "2020_2026",
                taxonomy_id: listing.taxonomy_id || 125,
                type: listing.type || "download",
                is_supply: listing.is_supply || false,
                state: "draft",
                tags: listing.tags,
                materials: listing.materials
            });

            listingId = created.listing_id;

            entry = listingMapService.setEntry(mapKey, {
                listingId,
                title: listing.title,
                status: "created"
            });

            summary.steps.listing = "created";

        } else {
            await etsyService.updateListing(listingId, {
                title: listing.title,
                description: listing.description,
                price: listing.price,
                quantity: listing.quantity,
                tags: listing.tags,
                materials: listing.materials
            });

            summary.steps.listing = "updated";
        }

        summary.listingId = listingId;

        // 2. Shop section - create it if it doesn't exist yet, then assign
        if (section) {
            const shopSection = await etsyService.getOrCreateShopSection(section);

            await etsyService.updateListing(listingId, {
                shop_section_id: shopSection.shop_section_id
            });

            summary.steps.section = shopSection.title;
        }

        // 3. Attributes/properties (optional)
        if (properties && properties.length > 0) {
            summary.steps.properties = await applyProperties(listingId, properties);
        }

        // 4. Images - reuses your existing numbered-image convention
        if (images && images.albumFolder && images.numbers) {
            summary.steps.images = await etsyService.replaceListingImages(
                listingId,
                images.albumFolder,
                images.numbers
            );
        }

        // 5. Digital PDF file
        if (pdf && pdf.artistFolder && pdf.fileName) {
            summary.steps.pdf = await etsyService.replaceListingFile(
                listingId,
                pdf.artistFolder,
                pdf.fileName
            );
        }

        listingMapService.setEntry(mapKey, {
            listingId,
            title: listing.title,
            status: "completed",
            lastError: null
        });

        summary.status = "completed";
        return summary;

    } catch (err) {
        listingMapService.setEntry(mapKey, {
            listingId: listingId || entry?.listingId || null,
            title: listing?.title,
            status: "failed",
            lastError: err.response?.data || err.message
        });

        throw err;
    }
}

module.exports = {
    runDigitalAlbum
};
