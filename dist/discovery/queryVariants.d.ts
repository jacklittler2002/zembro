/**
 * Generate multiple search query variants for better discovery coverage
 * Takes a base query and creates semantic variations
 *
 * @param baseQuery - Original search query (e.g., "dentists in London")
 * @returns Array of unique query variants
 *
 * TODO: Use AI (GPT-4) to generate smarter, context-aware variants
 * TODO: Consider location expansions (e.g., "London" -> "London UK", "Greater London")
 * TODO: Add industry-specific patterns (e.g., for healthcare, retail, B2B)
 */
export declare function buildDiscoveryQueries(baseQuery: string): string[];
/**
 * Parse a lead search query to extract structured components
 * Useful for more targeted search generation
 *
 * @param query - Raw search query
 * @returns Parsed components
 *
 * TODO: Use NLP to better extract niche, location, and qualifiers
 */
export declare function parseSearchQuery(query: string): {
    niche?: string;
    location?: string;
    qualifiers: string[];
};
//# sourceMappingURL=queryVariants.d.ts.map