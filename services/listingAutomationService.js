const etsyService = require("./etsyService");

async function updateListingProperties(listingId, properties = []) {
    const results = [];

    for (const property of properties) {
        const result =
            await etsyService.updateListingProperty(
                listingId,
                property.propertyId,
                property.valueIds,
                property.values
            );

        results.push({
            propertyId: property.propertyId,
            valueIds: property.valueIds,
            result
        });
    }

    return results;
}

async function updateCompleteListing(listingId, data) {

    const {
        listing,
        properties,
        images,
        pdf,
        section
    } = data;

    const result = {
        listing: null,
        properties: [],
        images: null,
        pdf: null
    };

    // 1. Update normal listing fields
    if (listing && Object.keys(listing).length > 0) {
        result.listing = await etsyService.updateListing(
            listingId,
            listing
        );
    }

    // 2. Update Etsy listing properties
    // 2. Update Etsy listing properties
    if (properties && properties.length > 0) {

        const currentListing =
            await etsyService.getListing(listingId);

        result.properties =
            await updateListingProperties(
                listingId,
                properties,
                currentListing.taxonomy_id
            );
    }

    // 3. Replace listing images
    if (images) {
        result.images =
            await etsyService.replaceListingImages(
                listingId,
                images.albumFolder,
                images.numbers
            );
    }

    // 4. Replace digital PDF
    if (pdf) {
        result.pdf =
            await etsyService.replaceListingFile(
                listingId,
                pdf.artistFolder,
                pdf.fileName
            );
    }

    return {
        success: true,
        listingId,
        result
    };
}

module.exports = {
    updateCompleteListing
};