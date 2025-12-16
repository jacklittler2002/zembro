"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDomainFromUrl = normalizeDomainFromUrl;
exports.isLikelyBusinessDomain = isLikelyBusinessDomain;
exports.extractBaseDomain = extractBaseDomain;
/**
 * Extract and normalize domain from a URL
 * @param url - Full URL string
 * @returns Normalized domain (lowercase, without www) or null if invalid
 */
function normalizeDomainFromUrl(url) {
    try {
        const u = new URL(url);
        let host = u.hostname.toLowerCase();
        // Remove www. prefix
        host = host.replace(/^www\./, "");
        return host;
    }
    catch {
        return null;
    }
}
/**
 * Patterns for domains to exclude from business discovery
 * These are typically social media, search engines, or aggregators
 */
const BLOCKED_HOST_PATTERNS = [
    "google.com",
    "google.co.uk",
    "webcache.googleusercontent.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "youtube.com",
    "instagram.com",
    "tiktok.com",
    "yelp.com",
    "yell.com",
    "tripadvisor.com",
    "trustpilot.com",
    "wikipedia.org",
    "amazon.com",
    "ebay.com",
    "gumtree.com",
];
/**
 * Check if a domain is likely a business website
 * Filters out social media, aggregators, and other non-business sites
 * @param domain - Normalized domain string
 * @returns true if likely a business domain
 */
function isLikelyBusinessDomain(domain) {
    if (!domain)
        return false;
    // Check against blocked patterns
    const isBlocked = BLOCKED_HOST_PATTERNS.some((pattern) => domain.endsWith(pattern));
    if (isBlocked)
        return false;
    // TODO: Add more sophisticated filtering:
    // - Check TLD quality (.com, .co.uk vs .blogspot.com)
    // - Validate domain structure
    // - Use ML model to classify business vs non-business
    return true;
}
/**
 * Extract base domain from subdomain
 * e.g., "shop.example.com" -> "example.com"
 */
function extractBaseDomain(domain) {
    const parts = domain.split(".");
    // Handle common cases
    if (parts.length <= 2) {
        return domain;
    }
    // Handle .co.uk, .com.au etc
    const secondToLast = parts[parts.length - 2];
    if (parts.length >= 3 && secondToLast && secondToLast.length <= 3) {
        return parts.slice(-3).join(".");
    }
    // Default: return last two parts
    return parts.slice(-2).join(".");
}
//# sourceMappingURL=domainUtils.js.map