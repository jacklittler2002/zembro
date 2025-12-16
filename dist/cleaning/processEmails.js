"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processExtractedEmails = processExtractedEmails;
const cleanEmail_1 = require("./cleanEmail");
/**
 * Process raw extracted emails:
 * - Normalize (lowercase, trim)
 * - Validate format
 * - Deduplicate
 * - Filter for lead quality
 */
function processExtractedEmails(rawEmails) {
    const normalized = rawEmails.map(cleanEmail_1.normalizeEmail).filter(cleanEmail_1.isValidEmail);
    const unique = Array.from(new Set(normalized));
    const highQuality = unique.filter(cleanEmail_1.isLeadQualityEmail);
    return {
        cleaned: unique,
        highQuality,
    };
}
//# sourceMappingURL=processEmails.js.map