"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDomain = normalizeDomain;
/**
 * Normalize a URL to its base domain
 * - Removes www prefix
 * - Converts to lowercase
 * - Handles invalid URLs gracefully
 */
function normalizeDomain(url) {
    try {
        let domain = new URL(url).hostname.toLowerCase();
        domain = domain.replace(/^www\./, "");
        return domain;
    }
    catch {
        return url.toLowerCase();
    }
}
//# sourceMappingURL=normalizeDomain.js.map