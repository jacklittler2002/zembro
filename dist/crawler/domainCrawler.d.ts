import { SocialLinks, AddressGuess } from "./structuredExtractors.js";
export interface CrawlResult {
    emails: string[];
    phones: string[];
    textContent: string;
    socialLinks: SocialLinks;
    addressGuess: AddressGuess;
    companyName: string | null;
    pagesVisited: number;
}
export interface CrawlOptions {
    /** Maximum number of pages to crawl per domain (default: 6) */
    maxPages?: number;
    /** Maximum depth from root (default: 2) */
    maxDepth?: number;
}
/**
 * Crawl a domain using a breadth-first approach
 * Prioritizes pages with interesting paths (contact, about, etc.)
 *
 * This performs a bounded multi-page crawl to extract:
 * - Email addresses
 * - Phone numbers
 * - Social media links
 * - Address information
 * - Company name
 * - Full text content
 *
 * TODO: Make maxPages configurable per subscription plan
 * TODO: Add caching to avoid re-crawling recently visited pages
 * TODO: Implement robots.txt respect
 * TODO: Add concurrent page fetching with rate limiting
 *
 * @param rootUrl - Base URL of the domain to crawl
 * @param options - Crawl configuration options
 * @returns Aggregated crawl results
 */
export declare function crawlDomain(rootUrl: string, options?: CrawlOptions): Promise<CrawlResult>;
//# sourceMappingURL=domainCrawler.d.ts.map