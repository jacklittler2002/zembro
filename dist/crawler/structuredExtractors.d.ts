export interface SocialLinks {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
}
export interface AddressGuess {
    rawText: string | null;
}
/**
 * Extract social media links from HTML
 * Looks for common social media domain patterns in anchor tags
 *
 * @param html - Raw HTML content
 * @returns Object with found social media URLs
 */
export declare function extractSocialLinks(html: string): SocialLinks;
/**
 * Attempt to extract address-like text from HTML
 * Very rough heuristic: looks for lines with numbers and street keywords
 *
 * TODO: Improve with:
 * - Postal code pattern matching (UK: SW1A 1AA, US: 12345)
 * - Structured data extraction (schema.org, microdata)
 * - NLP/NER for better address recognition
 * - Country/city database validation
 *
 * @param html - Raw HTML content
 * @returns Best guess for address text
 */
export declare function extractAddressGuess(html: string): AddressGuess;
/**
 * Extract company name from HTML
 * Looks in common locations: title, h1, meta tags
 *
 * @param html - Raw HTML content
 * @returns Extracted company name or null
 */
export declare function extractCompanyName(html: string): string | null;
/**
 * Extract business hours from HTML (rough heuristic)
 * TODO: Improve with structured data parsing and NLP
 *
 * @param html - Raw HTML content
 * @returns Array of text lines that might be business hours
 */
export declare function extractBusinessHours(html: string): string[];
//# sourceMappingURL=structuredExtractors.d.ts.map