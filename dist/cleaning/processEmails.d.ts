/**
 * Process raw extracted emails:
 * - Normalize (lowercase, trim)
 * - Validate format
 * - Deduplicate
 * - Filter for lead quality
 */
export declare function processExtractedEmails(rawEmails: string[]): {
    cleaned: string[];
    highQuality: string[];
};
//# sourceMappingURL=processEmails.d.ts.map