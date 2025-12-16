/**
 * Normalize a URL relative to a base URL
 * Filters out non-HTTP links and ensures same-domain only
 *
 * @param baseUrl - The base URL of the page
 * @param href - The href attribute value
 * @returns Normalized absolute URL or null if invalid/external
 */
export declare function normalizeUrl(baseUrl: string, href: string): string | null;
/**
 * Check if a URL path contains interesting keywords
 * Used to prioritize crawling pages likely to have contact info
 *
 * @param url - Full URL to check
 * @returns true if URL path contains interesting keywords
 */
export declare function isInterestingPath(url: string): boolean;
/**
 * Check if URL should be skipped based on common patterns
 * @param url - URL to check
 * @returns true if URL should be skipped
 */
export declare function shouldSkipUrl(url: string): boolean;
//# sourceMappingURL=urlUtils.d.ts.map