"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeads = getLeads;
exports.getLeadById = getLeadById;
exports.updateLead = updateLead;
exports.getLeadIndustries = getLeadIndustries;
exports.getLeadCountries = getLeadCountries;
exports.getLeadStats = getLeadStats;
const db_1 = require("../db");
const logger_1 = require("../logger");
/**
 * Get all leads (companies with contacts) for a user with filtering and pagination
 */
async function getLeads(filters) {
    const { userId, industry, sizeBucket, country, minScore, isFavorited, isArchived = false, // Default to exclude archived
    search, page = 1, pageSize = 50, } = filters;
    logger_1.logger.info("Fetching leads with filters", { userId, filters });
    // Build where clause
    const where = {
        // Only show companies that belong to this user's lead searches
        leadSearches: {
            some: {
                userId,
            },
        },
        isArchived,
    };
    if (industry) {
        where.industry = { equals: industry, mode: "insensitive" };
    }
    if (sizeBucket) {
        where.sizeBucket = sizeBucket;
    }
    if (country) {
        where.hqCountry = { equals: country, mode: "insensitive" };
    }
    if (minScore !== undefined) {
        where.aiConfidence = { gte: minScore };
    }
    if (isFavorited !== undefined) {
        where.isFavorited = isFavorited;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { domain: { contains: search, mode: "insensitive" } },
        ];
    }
    // Get total count for pagination
    const totalCount = await db_1.prisma.company.count({ where });
    // Fetch companies with contacts
    const companies = await db_1.prisma.company.findMany({
        where,
        include: {
            contacts: {
                orderBy: {
                    isLikelyDecisionMaker: "desc", // Show decision makers first
                },
                take: 5, // Limit contacts per company for performance
            },
        },
        orderBy: [
            { isFavorited: "desc" }, // Favorited first
            { aiConfidence: "desc" }, // Then by score
            { createdAt: "desc" }, // Then by newest
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
    });
    logger_1.logger.info("Fetched leads", {
        userId,
        count: companies.length,
        totalCount,
        page,
    });
    return {
        leads: companies,
        pagination: {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
        },
    };
}
/**
 * Get a single lead (company) with all details
 */
async function getLeadById(companyId, userId) {
    logger_1.logger.info("Fetching lead by ID", { companyId, userId });
    const company = await db_1.prisma.company.findFirst({
        where: {
            id: companyId,
            leadSearches: {
                some: {
                    userId,
                },
            },
        },
        include: {
            contacts: {
                orderBy: {
                    isLikelyDecisionMaker: "desc",
                },
            },
            leadSearches: {
                where: { userId },
                select: {
                    id: true,
                    query: true,
                    createdAt: true,
                },
            },
            listLeads: {
                include: {
                    list: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        },
                    },
                },
            },
        },
    });
    if (!company) {
        throw new Error("Lead not found or access denied");
    }
    return company;
}
/**
 * Update lead status (favorite, archive, notes)
 */
async function updateLead(input) {
    const { companyId, userId, isFavorited, isArchived, notes } = input;
    logger_1.logger.info("Updating lead", { companyId, userId, updates: input });
    // Verify user has access to this company
    const company = await db_1.prisma.company.findFirst({
        where: {
            id: companyId,
            leadSearches: {
                some: {
                    userId,
                },
            },
        },
    });
    if (!company) {
        throw new Error("Lead not found or access denied");
    }
    // Update company
    const updated = await db_1.prisma.company.update({
        where: { id: companyId },
        data: {
            ...(isFavorited !== undefined && { isFavorited }),
            ...(isArchived !== undefined && { isArchived }),
            ...(notes !== undefined && { notes }),
        },
        include: {
            contacts: {
                orderBy: {
                    isLikelyDecisionMaker: "desc",
                },
                take: 5,
            },
        },
    });
    logger_1.logger.info("Lead updated", { companyId, userId });
    return updated;
}
/**
 * Get unique industries from user's leads for filter dropdown
 */
async function getLeadIndustries(userId) {
    const companies = await db_1.prisma.company.findMany({
        where: {
            leadSearches: {
                some: {
                    userId,
                },
            },
            industry: {
                not: null,
            },
        },
        select: {
            industry: true,
        },
        distinct: ["industry"],
        orderBy: {
            industry: "asc",
        },
    });
    return companies.map((c) => c.industry).filter(Boolean);
}
/**
 * Get unique countries from user's leads for filter dropdown
 */
async function getLeadCountries(userId) {
    const companies = await db_1.prisma.company.findMany({
        where: {
            leadSearches: {
                some: {
                    userId,
                },
            },
            hqCountry: {
                not: null,
            },
        },
        select: {
            hqCountry: true,
        },
        distinct: ["hqCountry"],
        orderBy: {
            hqCountry: "asc",
        },
    });
    return companies.map((c) => c.hqCountry).filter(Boolean);
}
/**
 * Get lead statistics for a user
 */
async function getLeadStats(userId) {
    const [totalLeads, favoritedLeads, archivedLeads, companiesWithContacts, avgScore,] = await Promise.all([
        db_1.prisma.company.count({
            where: {
                leadSearches: {
                    some: { userId },
                },
                isArchived: false,
            },
        }),
        db_1.prisma.company.count({
            where: {
                leadSearches: {
                    some: { userId },
                },
                isFavorited: true,
                isArchived: false,
            },
        }),
        db_1.prisma.company.count({
            where: {
                leadSearches: {
                    some: { userId },
                },
                isArchived: true,
            },
        }),
        db_1.prisma.company.count({
            where: {
                leadSearches: {
                    some: { userId },
                },
                contacts: {
                    some: {},
                },
                isArchived: false,
            },
        }),
        db_1.prisma.company.aggregate({
            where: {
                leadSearches: {
                    some: { userId },
                },
                aiConfidence: {
                    not: null,
                },
                isArchived: false,
            },
            _avg: {
                aiConfidence: true,
            },
        }),
    ]);
    return {
        totalLeads,
        favoritedLeads,
        archivedLeads,
        companiesWithContacts,
        avgScore: avgScore._avg.aiConfidence
            ? Math.round(avgScore._avg.aiConfidence * 100)
            : null,
    };
}
//# sourceMappingURL=leadService.js.map