export interface SerperResult {
    url: string;
    title: string;
    snippet: string;
}
/**
 * Search Google via Serper.dev API
 * @param query - Search query string
 * @param numPages - Number of result pages to fetch (default: 1)
 * @returns Array of search results
 */
export declare function serperSearch(query: string, numPages?: number): Promise<SerperResult[]>;
//# sourceMappingURL=serpClient.d.ts.map