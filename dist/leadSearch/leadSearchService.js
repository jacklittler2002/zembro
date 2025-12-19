"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadSearchService = void 0;
exports.createLeadSearch = createLeadSearch;
exports.getLeadSearchById = getLeadSearchById;
exports.markLeadSearchStatus = markLeadSearchStatus;
exports.getLeadSearchLeads = getLeadSearchLeads;
const db_1 = require("../db");
const jobService_1 = require("../jobs/jobService");
const logger_1 = require("../logger");
const getPlan_1 = require("../monetization/getPlan");
const enforce_1 = require("../monetization/enforce");
const policyIntegration_1 = require("../policies/policyIntegration");
/**
 * Lead Search Service with Policy Enforcement
 * Extends PolicyAwareService for automatic policy checks
 */
class LeadSearchService extends policyIntegration_1.PolicyAwareService {
    /**
     * Create a new LeadSearch with policy enforcement
     */
    async createLeadSearch(input) {
        const userId = input.userId;
        // Enforce policy before proceeding
        await this.enforce(userId, "create", "leadSearch", input);
        // Validate input data
        await this.validate(userId, "leadSearch", "create", input);
        const plan = await (0, getPlan_1.getUserPlanCode)(userId);
        const ent = (0, enforce_1.getEntitlements)(plan);
        const activeCount = await db_1.prisma.leadSearch.count({
            where: {
                userId: userId,
                status: { in: ["PENDING", "RUNNING"] },
            },
        });
        if (activeCount >= ent.maxActiveSearches) {
            throw new enforce_1.PlanLimitError({ limit: "maxActiveSearches", allowed: ent.maxActiveSearches });
        }
        const cappedMaxLeads = (0, enforce_1.clampByPlan)(plan, input.maxLeads || 100, "maxLeadsPerSearch");
        // NOTE: Credits are now charged per delivered lead, not upfront
        // Check that user has some credits available (soft check)
        const wallet = await db_1.prisma.aiCreditWallet.findUnique({
            where: { userId },
        });
        if (!wallet || wallet.balance <= 0) {
            throw new Error("Insufficient credits to start lead search. At least 1 credit required.");
        }
        const leadSearch = await db_1.prisma.leadSearch.create({
            data: {
                userId: userId,
                query: input.query,
                maxLeads: cappedMaxLeads,
                status: "PENDING",
                filters: input.filters || null,
            },
        });
        logger_1.logger.info(`Created LeadSearch ${leadSearch.id} for query: ${input.query}`);
        // Immediately enqueue DISCOVERY job
        await (0, jobService_1.enqueueJob)({
            type: "DISCOVERY",
            leadSearchId: leadSearch.id,
            targetUrl: null,
        });
        logger_1.logger.info(`Enqueued DISCOVERY job for LeadSearch ${leadSearch.id}`);
        return leadSearch;
    }
    /**
     * Get a LeadSearch by ID with policy filtering
     */
    async getLeadSearchById(userId, id) {
        // Filter results based on user permissions
        const leadSearch = await this.filter(userId, "leadSearch", "read", await db_1.prisma.leadSearch.findUnique({
            where: { id },
        }));
        return leadSearch;
    } /**
     * Update LeadSearch status with policy checks
     */
    async markLeadSearchStatus(userId, id, status, errorMessage) {
        // Check if user can update this lead search
        await this.enforce(userId, "update", "leadSearch", { id, status });
        await db_1.prisma.leadSearch.update({
            where: { id },
            data: {
                status,
                errorMessage: errorMessage || null,
            },
        });
        logger_1.logger.info(`Updated LeadSearch ${id} to status: ${status}`);
    }
}
exports.LeadSearchService = LeadSearchService;
// Create singleton instance for backward compatibility
const leadSearchService = new LeadSearchService();
/**
 * Create a new LeadSearch and immediately enqueue a DISCOVERY job
 * @deprecated Use LeadSearchService.createLeadSearch() instead
 */
async function createLeadSearch(input) {
    return await leadSearchService.createLeadSearch(input);
}
/**
 * Get a LeadSearch by ID
 * @deprecated Use LeadSearchService.getLeadSearchById() instead
 */
async function getLeadSearchById(id) {
    return await db_1.prisma.leadSearch.findUnique({
        where: { id },
    });
}
/**
 * Update LeadSearch status
 * @deprecated Use LeadSearchService.markLeadSearchStatus() instead
 */
async function markLeadSearchStatus(id, status, errorMessage) {
    // For backward compatibility, we can't enforce policies here without userId
    // New code should use the service instance
    await db_1.prisma.leadSearch.update({
        where: { id },
        data: {
            status,
            errorMessage: errorMessage || null,
        },
    });
    logger_1.logger.info(`Updated LeadSearch ${id} to status: ${status}`);
}
/**
 * Get all leads (contacts) associated with a LeadSearch with advanced filtering
 *
 * TODO: More precise linking between LeadSearch and Company (currently uses relation)
 * TODO: Plan-based limits for different subscription tiers
 * TODO: Add caching for expensive queries
 */
async function getLeadSearchLeads(id, options = {}) {
    // If user wants to exclude previous exports, fetch their export history
    let exportedCompanyIds = [];
    if (options.excludePreviousExports && options.userId) {
        const previousExports = await db_1.prisma.leadExport.findMany({
            where: { userId: options.userId },
            select: { companyId: true },
        });
        exportedCompanyIds = previousExports.map((exp) => exp.companyId);
        logger_1.logger.info(`Excluding ${exportedCompanyIds.length} previously exported companies for user ${options.userId}`);
    }
    const leadSearch = await db_1.prisma.leadSearch.findUnique({
        where: { id },
        include: {
            companies: {
                where: {
                    // Exclude previously exported companies
                    ...(exportedCompanyIds.length > 0
                        ? { id: { notIn: exportedCompanyIds } }
                        : {}),
                    // Apply company-level filters
                    ...(options.minScore
                        ? { aiConfidence: { gte: options.minScore } }
                        : {}),
                    ...(options.industry
                        ? { industry: { equals: options.industry, mode: "insensitive" } }
                        : {}),
                    ...(options.sizeBucket ? { sizeBucket: options.sizeBucket } : {}),
                    ...(options.country
                        ? { hqCountry: { equals: options.country, mode: "insensitive" } }
                        : {}),
                    ...(options.techStack && options.techStack.length > 0
                        ? { techStack: { hasSome: options.techStack } }
                        : {}),
                    ...(options.fundingStage
                        ? { fundingStage: { equals: options.fundingStage, mode: "insensitive" } }
                        : {}),
                },
                include: {
                    contacts: {
                        where: {
                            // Apply contact-level filters
                            ...(options.decisionMakerOnly
                                ? { isLikelyDecisionMaker: true }
                                : {}),
                            ...(options.jobTitle
                                ? { role: { contains: options.jobTitle, mode: "insensitive" } }
                                : {}),
                        },
                    },
                },
            },
        },
    });
    if (!leadSearch) {
        return [];
    }
    const leads = [];
    for (const company of leadSearch.companies) {
        for (const contact of company.contacts) {
            leads.push({
                email: contact.email,
                firstName: contact.firstName,
                lastName: contact.lastName,
                companyName: company.name,
                websiteUrl: company.websiteUrl,
                city: company.hqCity,
                country: company.hqCountry,
                niche: company.niche,
                industry: company.industry,
                sizeBucket: company.sizeBucket,
                role: contact.role,
                isDecisionMaker: contact.isLikelyDecisionMaker,
                score: company.aiConfidence,
            });
        }
    }
    // Apply limit
    const limit = options.limit || leadSearch.maxLeads;
    return leads.slice(0, limit);
}
//# sourceMappingURL=leadSearchService.js.map