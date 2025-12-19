"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
            case "create_lead_search": {
                return await handleCreateLeadSearch(userId, args);
            }
            case "get_lead_search_status": {
                return await handleGetLeadSearchStatus(userId, args);
            }
            case "get_leads": {
                return await handleGetLeads(userId, args);
            }
            case "export_leads_to_csv": {
                return await handleExportLeadsToCsv(userId, args);
            }
            case "get_credit_balance": {
                return await handleGetCreditBalance(userId);
            }
            case "estimate_credits": {
                return await handleEstimateCredits(args);
            }
            case "list_user_lead_searches": {
                return await handleListUserLeadSearches(userId, args);
            }
            case "create_campaign": {
                return await handleCreateCampaign(userId, args);
            }
            case "import_leads_to_campaign": {
                return await handleImportLeadsToCampaign(userId, args);
            }
            case "update_campaign_status": {
                return await handleUpdateCampaignStatus(userId, args);
            }
            case "get_campaign_stats": {
                return await handleGetCampaignStats(userId, args);
            }
            default: {
                return JSON.stringify({ error: `Unknown tool: ${toolName}` });
            }
        }
        // --- Campaign/Outreach handlers ---
        async function handleCreateCampaign(userId, args) {
            const { name, emailAccountIds, leadSearchId, listId, steps, scheduleStartAt, scheduleEndAt, sendTimeStart, sendTimeEnd, timezone, dailyLimit } = args;
            const { createCampaign } = await Promise.resolve().then(() => __importStar(require("../email/campaignService")));
            const campaign = await createCampaign({
                userId,
                name,
                emailAccountIds,
                leadSearchId,
                listId,
                steps,
                scheduleStartAt,
                scheduleEndAt,
                sendTimeStart,
                sendTimeEnd,
                timezone,
                dailyLimit,
            });
            return JSON.stringify({ success: true, campaignId: campaign.id, name: campaign.name });
        }
        async function handleImportLeadsToCampaign(userId, args) {
            const { campaignId, ...options } = args;
            const { importLeadsFromSearch } = await Promise.resolve().then(() => __importStar(require("../email/campaignService")));
            const result = await importLeadsFromSearch(campaignId, userId, options);
            return JSON.stringify({ success: true, ...result });
        }
        async function handleUpdateCampaignStatus(userId, args) {
            const { campaignId, status } = args;
            const { updateCampaignStatus } = await Promise.resolve().then(() => __importStar(require("../email/campaignService")));
            await updateCampaignStatus(campaignId, userId, status);
            return JSON.stringify({ success: true, campaignId, status });
        }
        async function handleGetCampaignStats(userId, args) {
            const { campaignId } = args;
            const { getCampaignStats } = await Promise.resolve().then(() => __importStar(require("../email/emailSendingService")));
            const stats = await getCampaignStats(campaignId);
            return JSON.stringify({ success: true, campaignId, stats });
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