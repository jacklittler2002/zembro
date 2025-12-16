"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLeadSearch = createLeadSearch;
exports.getLeadSearchById = getLeadSearchById;
exports.markLeadSearchStatus = markLeadSearchStatus;
exports.getLeadSearchLeads = getLeadSearchLeads;
const db_1 = require("../db");
const jobService_1 = require("../jobs/jobService");
const logger_1 = require("../logger");
const planLimits_1 = require("../billing/planLimits");
const getUserPlan_1 = require("../billing/getUserPlan");
/**
 * Create a new LeadSearch and immediately enqueue a DISCOVERY job
 */
async function createLeadSearch(input) {
    const plan = await (0, getUserPlan_1.getUserPlanCode)(input.userId);
    const limits = planLimits_1.PLAN_LIMITS[plan];
    const activeCount = await db_1.prisma.leadSearch.count({
        where: {
            userId: input.userId,
            status: { in: ["PENDING", "RUNNING"] },
        },
    });
    if (activeCount >= limits.maxLeadSearchActive) {
        const err = new Error("PLAN_LIMIT_REACHED");
        err.code = "PLAN_LIMIT_REACHED";
        err.limit = "maxLeadSearchActive";
        err.allowed = limits.maxLeadSearchActive;
        throw err;
    }
    const cappedMaxLeads = Math.min(input.maxLeads || 100, limits.maxLeadSearchMaxLeads);
    const leadSearch = await db_1.prisma.leadSearch.create({
        data: {
            userId: input.userId,
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
 * Get a LeadSearch by ID
 */
async function getLeadSearchById(id) {
    return await db_1.prisma.leadSearch.findUnique({
        where: { id },
    });
}
/**
 * Update LeadSearch status
 */
async function markLeadSearchStatus(id, status, errorMessage) {
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
                },
                include: {
                    contacts: {
                        where: {
                            // Apply contact-level filters
                            ...(options.decisionMakerOnly
                                ? { isLikelyDecisionMaker: true }
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