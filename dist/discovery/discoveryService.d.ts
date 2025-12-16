/**
 * Run discovery pipeline for a LeadSearch
 *
 * This function:
 * 1. Fetches the LeadSearch from DB
 * 2. Discovers candidate sites via web search (Serper API)
 * 3. Creates Company records for new domains
 * 4. Enqueues SITE_CRAWL jobs for each company
 *
 * @param leadSearchId - ID of the LeadSearch to process
 */
export declare function runDiscoveryForLeadSearch(leadSearchId: string): Promise<void>;
//# sourceMappingURL=discoveryService.d.ts.map