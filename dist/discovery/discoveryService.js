"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDiscoveryForLeadSearch = runDiscoveryForLeadSearch;
const db_js_1 = require("../db.js");
const logger_1 = require("../logger");
const jobService_js_1 = require("../jobs/jobService.js");
const normalizeDomain_js_1 = require("../utils/normalizeDomain.js");
const discoveryEngine_js_1 = require("./discoveryEngine.js");
/**
 * DEPRECATED: mock discovery function.
 * Kept for fallback if SERPER_API_KEY is not configured.
 */
async function mockSearchWeb(query) {
    logger_1.logger.warn(`Using MOCK discovery (SERPER_API_KEY not configured) for query: ${query}`);
    // Fallback mock results
    return [
        "https://example-dentist-1.co.uk",
        "https://example-dentist-2.co.uk",
        "https://example-dentist-3.co.uk",
    ];
}
// Use the centralized normalizeDomain utility instead of local function
// (removed extractDomain in favor of normalizeDomain from utils)
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
async function runDiscoveryForLeadSearch(leadSearchId) {
    const leadSearch = await db_js_1.prisma.leadSearch.findUnique({
        where: { id: leadSearchId },
    });
    if (!leadSearch) {
        logger_1.logger.warn("Discovery called with invalid LeadSearchId", { leadSearchId });
        return;
    }
    const query = leadSearch.query;
    const maxLeads = leadSearch.maxLeads ?? 100;
    logger_1.logger.info("Starting discovery for LeadSearch", {
        leadSearchId,
        query,
        maxLeads,
    });
    // Use real discovery engine (Serper API)
    let sites;
    if (process.env.SERPER_API_KEY) {
        sites = await (0, discoveryEngine_js_1.discoverCandidateSites)(query, {
            pagesPerQuery: 2, // Fetch 2 pages per query variant
            maxResults: maxLeads * 3, // Get extra candidates for filtering
        });
    }
    else {
        // Fallback to mock if no API key
        logger_1.logger.warn("SERPER_API_KEY not set, using mock discovery");
        const mockUrls = await mockSearchWeb(query);
        sites = mockUrls.map(url => ({
            url,
            domain: (0, normalizeDomain_js_1.normalizeDomain)(url),
            title: undefined,
            snippet: undefined,
        }));
    }
    logger_1.logger.info("Discovery found candidate sites", {
        leadSearchId,
        query,
        siteCount: sites.length,
    });
    let companiesCreated = 0;
    let jobsEnqueued = 0;
    for (const site of sites) {
        // Check if company already exists
        const existing = await db_js_1.prisma.company.findFirst({
            where: { domain: site.domain },
        });
        let company;
        if (existing) {
            company = existing;
            logger_1.logger.info("Company already exists", { domain: site.domain });
        }
        else {
            company = await db_js_1.prisma.company.create({
                data: {
                    name: site.title || site.domain, // Use search result title if available
                    domain: site.domain,
                    websiteUrl: site.url,
                    source: "discovery_serp",
                    lastSeenAt: new Date(),
                    // Store snippet for later AI enrichment
                    rawContent: site.snippet || null,
                },
            });
            companiesCreated++;
            logger_1.logger.info("Created company from discovery", {
                domain: site.domain,
                title: site.title,
                leadSearchId,
            });
        }
        // Link company to lead search
        await db_js_1.prisma.company.update({
            where: { id: company.id },
            data: {
                leadSearches: {
                    connect: { id: leadSearch.id },
                },
            },
        });
        // Enqueue SITE_CRAWL job for this company
        await (0, jobService_js_1.enqueueJob)({
            type: "SITE_CRAWL",
            companyId: company.id,
            targetUrl: company.websiteUrl ?? site.url,
            leadSearchId: leadSearch.id,
        });
        jobsEnqueued++;
    }
    // Increment discoveredCount on LeadSearch
    if (companiesCreated > 0) {
        await db_js_1.prisma.leadSearch.update({
            where: { id: leadSearchId },
            data: { discoveredCount: { increment: companiesCreated } },
        });
    }
    logger_1.logger.info("Discovery pipeline completed for LeadSearch", {
        leadSearchId,
        query,
        companiesCreated,
        jobsEnqueued,
        totalSites: sites.length,
    });
}
//# sourceMappingURL=discoveryService.js.map