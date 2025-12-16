"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTool = executeTool;
const logger_1 = require("../logger");
const leadSearchService_1 = require("../leadSearch/leadSearchService");
const creditService_1 = require("./creditService");
const leadSearchExportService_1 = require("../export/leadSearchExportService");
const db_1 = require("../db");
/**
 * Execute a tool call from GPT-4o
 *
 * Takes the function name and arguments from GPT, runs the actual backend logic,
 * and returns results in a format GPT can understand.
 */
async function executeTool(userId, toolName, args) {
    logger_1.logger.info(`TED executing tool: ${toolName}`, { userId, args });
    try {
        switch (toolName) {
            case "create_lead_search":
                return await handleCreateLeadSearch(userId, args);
            case "get_lead_search_status":
                return await handleGetLeadSearchStatus(userId, args);
            case "get_leads":
                return await handleGetLeads(userId, args);
            case "export_leads_to_csv":
                return await handleExportLeadsToCsv(userId, args);
            case "get_credit_balance":
                return await handleGetCreditBalance(userId);
            case "estimate_credits":
                return await handleEstimateCredits(args);
            case "list_user_lead_searches":
                return await handleListUserLeadSearches(userId, args);
            default:
                return JSON.stringify({ error: `Unknown tool: ${toolName}` });
        }
    }
    catch (error) {
        logger_1.logger.error(`Error executing tool ${toolName}:`, error);
        return JSON.stringify({
            error: error.message || "Tool execution failed",
        });
    }
}
async function handleCreateLeadSearch(userId, args) {
    const { query, maxLeads = 100 } = args;
    const leadSearch = await (0, leadSearchService_1.createLeadSearch)({
        userId,
        query,
        maxLeads,
    });
    return JSON.stringify({
        success: true,
        leadSearchId: leadSearch.id,
        query: leadSearch.query,
        maxLeads: leadSearch.maxLeads,
        status: leadSearch.status,
        message: `Lead search created! Discovery pipeline is now running. This typically takes 2-5 minutes to complete.`,
    });
}
async function handleGetLeadSearchStatus(userId, args) {
    const { leadSearchId } = args;
    const leadSearch = await (0, leadSearchService_1.getLeadSearchById)(leadSearchId);
    if (!leadSearch) {
        return JSON.stringify({ error: "Lead search not found" });
    }
    if (leadSearch.userId !== userId) {
        return JSON.stringify({ error: "Unauthorized - lead search belongs to another user" });
    }
    // Count companies found
    const companiesCount = await db_1.prisma.company.count({
        where: {
            leadSearches: {
                some: {
                    id: leadSearchId,
                },
            },
        },
    });
    // Count contacts found
    const contactsCount = await db_1.prisma.contact.count({
        where: {
            company: {
                leadSearches: {
                    some: {
                        id: leadSearchId,
                    },
                },
            },
        },
    });
    return JSON.stringify({
        leadSearchId: leadSearch.id,
        query: leadSearch.query,
        status: leadSearch.status,
        maxLeads: leadSearch.maxLeads,
        companiesFound: companiesCount,
        contactsFound: contactsCount,
        errorMessage: leadSearch.errorMessage,
        createdAt: leadSearch.createdAt,
    });
}
async function handleGetLeads(userId, args) {
    const { leadSearchId, minScore, industry, sizeBucket, country, decisionMakerOnly = false, excludePreviousExports = true, limit, } = args;
    const leadSearch = await (0, leadSearchService_1.getLeadSearchById)(leadSearchId);
    if (!leadSearch) {
        return JSON.stringify({ error: "Lead search not found" });
    }
    if (leadSearch.userId !== userId) {
        return JSON.stringify({ error: "Unauthorized" });
    }
    const leads = await (0, leadSearchService_1.getLeadSearchLeads)(leadSearchId, {
        minScore,
        industry,
        sizeBucket,
        country,
        decisionMakerOnly,
        excludePreviousExports,
        userId,
        limit,
    });
    return JSON.stringify({
        leadSearchId,
        query: leadSearch.query,
        leads,
        count: leads.length,
        filters: {
            minScore,
            industry,
            sizeBucket,
            country,
            decisionMakerOnly,
            excludePreviousExports,
        },
    });
}
async function handleExportLeadsToCsv(userId, args) {
    const { leadSearchId, excludePreviousExports = true } = args;
    const leadSearch = await (0, leadSearchService_1.getLeadSearchById)(leadSearchId);
    if (!leadSearch) {
        return JSON.stringify({ error: "Lead search not found" });
    }
    if (leadSearch.userId !== userId) {
        return JSON.stringify({ error: "Unauthorized" });
    }
    const csv = await (0, leadSearchExportService_1.exportLeadSearchToCsv)(leadSearchId, userId, {
        excludePreviousExports,
    });
    const rowCount = csv.split("\n").length - 1; // Subtract header row
    return JSON.stringify({
        success: true,
        leadSearchId,
        rowCount,
        message: `Exported ${rowCount} leads to CSV. The export has been tracked to prevent duplicates in future searches.`,
        note: "CSV data is available for download via the web interface at /app/lead-searches/${leadSearchId}",
    });
}
async function handleGetCreditBalance(userId) {
    const balance = await (0, creditService_1.getCreditBalance)(userId);
    return JSON.stringify({
        balance,
        message: `You have ${balance} credits remaining.`,
    });
}
async function handleEstimateCredits(args) {
    const { maxLeads = 100 } = args;
    // Cost breakdown:
    // - Discovery: ~10 credits (search queries)
    // - Crawling: free
    // - Enrichment: 1 credit per company
    // - Contact enrichment: free (regex-based)
    const discoveryCredits = 10;
    const enrichmentCredits = maxLeads;
    const totalCredits = discoveryCredits + enrichmentCredits;
    return JSON.stringify({
        maxLeads,
        estimatedCredits: totalCredits,
        breakdown: {
            discovery: discoveryCredits,
            enrichment: enrichmentCredits,
            crawling: 0,
            contactEnrichment: 0,
        },
        message: `A lead search for ${maxLeads} companies will cost approximately ${totalCredits} credits.`,
    });
}
async function handleListUserLeadSearches(userId, args) {
    const { limit = 10 } = args;
    const searches = await db_1.prisma.leadSearch.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
            _count: {
                select: {
                    companies: true,
                },
            },
        },
    });
    return JSON.stringify({
        searches: searches.map((s) => ({
            id: s.id,
            query: s.query,
            status: s.status,
            maxLeads: s.maxLeads,
            companiesFound: s._count.companies,
            createdAt: s.createdAt,
        })),
        count: searches.length,
    });
}
//# sourceMappingURL=toolExecutor.js.map