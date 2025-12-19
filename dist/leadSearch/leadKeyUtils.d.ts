/**
 * Generate a deterministic lead key for deduplication and charging.
 * Priority order: website/domain > google_maps_place_id > normalized companyName + city + country
 */
export declare function generateLeadKey(contact: {
    email: string;
    company?: {
        domain?: string | null;
        websiteUrl?: string | null;
        name?: string;
        city?: string | null;
        country?: string | null;
        googleMapsPlaceId?: string | null;
    };
}): string;
/**
 * Check if a lead key has already been delivered to a user
 */
export declare function hasLeadBeenDelivered(userId: string, leadKey: string): Promise<boolean>;
//# sourceMappingURL=leadKeyUtils.d.ts.map