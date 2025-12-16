export interface DiscoveredSite {
    url: string;
    domain: string;
    title?: string;
    snippet?: string;
}
export interface DiscoveryOptions {
    /** Number of result pages to fetch per query (default: 1) */
    pagesPerQuery?: number;
    /** Maximum total results to return (default: 100) */
    maxResults?: number;
}
/**
 * Discover candidate business sites using web search
 *
 * This function:
 * 1. Generates multiple query variants
 * 2. Searches each variant via Serper API
 * 3. Normalizes and filters domains
 * 4. Deduplicates by domain
 * 5. Returns up to maxResults sites
 *
 * @param baseQuery - Original search query (e.g., "dentists in London")
 * @param options - Discovery configuration options
 * @returns Array of discovered sites with normalized domains
 */
export declare function discoverCandidateSites(baseQuery: string, options?: DiscoveryOptions): Promise<DiscoveredSite[]>;
/**
 * Score a discovered site based on relevance indicators
 * Higher score = more likely to be relevant
 *
 * TODO: Implement sophisticated scoring using:
 * - Query term matches in title/snippet
 * - Domain quality indicators
 * - Page rank proxies
 * - ML model predictions
 */
export declare function scoreDiscoveredSite(site: DiscoveredSite, baseQuery: string): number;
//# sourceMappingURL=discoveryEngine.d.ts.map