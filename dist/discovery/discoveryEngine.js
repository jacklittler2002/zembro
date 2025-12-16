"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverCandidateSites = discoverCandidateSites;
exports.scoreDiscoveredSite = scoreDiscoveredSite;
const serpClient_js_1 = require("./serpClient.js");
const domainUtils_js_1 = require("../utils/domainUtils.js");
const logger_js_1 = require("../logger.js");
const queryVariants_js_1 = require("./queryVariants.js");
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
async function discoverCandidateSites(baseQuery, options = {}) {
    const pagesPerQuery = options.pagesPerQuery ?? 1;
    const maxResults = options.maxResults ?? 100;
    const queries = (0, queryVariants_js_1.buildDiscoveryQueries)(baseQuery);
    logger_js_1.logger.info("Running discovery with query variants", {
        baseQuery,
        variantCount: queries.length,
        queries,
        pagesPerQuery,
        maxResults,
    });
    const all = [];
    // Search each query variant
    for (const q of queries) {
        const results = await (0, serpClient_js_1.serperSearch)(q, pagesPerQuery);
        for (const r of results) {
            const domain = (0, domainUtils_js_1.normalizeDomainFromUrl)(r.url);
            if (!domain) {
                logger_js_1.logger.info("Skipping result with invalid domain", { url: r.url });
                continue;
            }
            if (!(0, domainUtils_js_1.isLikelyBusinessDomain)(domain)) {
                logger_js_1.logger.info("Skipping non-business domain", { domain, url: r.url });
                continue;
            }
            all.push({
                url: r.url,
                domain,
                title: r.title,
                snippet: r.snippet,
            });
        }
        logger_js_1.logger.info("Processed query variant", {
            query: q,
            resultsFound: results.length,
            totalSoFar: all.length,
        });
    }
    logger_js_1.logger.info("Discovery collected raw results", {
        baseQuery,
        totalBeforeDedup: all.length,
    });
    // Deduplicate by domain, keeping first occurrence
    const byDomain = new Map();
    for (const site of all) {
        if (!byDomain.has(site.domain)) {
            byDomain.set(site.domain, site);
        }
    }
    const deduped = Array.from(byDomain.values());
    logger_js_1.logger.info("Discovery deduplicated results", {
        baseQuery,
        totalAfterDedup: deduped.length,
        uniqueDomains: deduped.length,
    });
    // Limit to maxResults
    if (deduped.length > maxResults) {
        logger_js_1.logger.info("Limiting discovery results to maxResults", {
            found: deduped.length,
            maxResults,
        });
        return deduped.slice(0, maxResults);
    }
    return deduped;
}
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
function scoreDiscoveredSite(site, baseQuery) {
    let score = 0;
    // Basic scoring heuristics
    const queryTerms = baseQuery.toLowerCase().split(/\s+/);
    if (site.title) {
        const titleLower = site.title.toLowerCase();
        queryTerms.forEach(term => {
            if (titleLower.includes(term))
                score += 2;
        });
    }
    if (site.snippet) {
        const snippetLower = site.snippet.toLowerCase();
        queryTerms.forEach(term => {
            if (snippetLower.includes(term))
                score += 1;
        });
    }
    // Prefer .com and .co.uk domains
    if (site.domain.endsWith(".com"))
        score += 1;
    if (site.domain.endsWith(".co.uk"))
        score += 1;
    return score;
}
//# sourceMappingURL=discoveryEngine.js.map