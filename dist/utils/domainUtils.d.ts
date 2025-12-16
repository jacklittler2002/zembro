/**
 * Extract and normalize domain from a URL
 * @param url - Full URL string
 * @returns Normalized domain (lowercase, without www) or null if invalid
 */
export declare function normalizeDomainFromUrl(url: string): string | null;
/**
 * Check if a domain is likely a business website
 * Filters out social media, aggregators, and other non-business sites
 * @param domain - Normalized domain string
 * @returns true if likely a business domain
 */
export declare function isLikelyBusinessDomain(domain: string): boolean;
/**
 * Extract base domain from subdomain
 * e.g., "shop.example.com" -> "example.com"
 */
export declare function extractBaseDomain(domain: string): string;
//# sourceMappingURL=domainUtils.d.ts.map