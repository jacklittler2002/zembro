import { prisma } from "../db";
import { logger } from "../logger";
import { CompanySize } from "@prisma/client";

export interface LeadFilters {
  userId: string;
  industry?: string;
  sizeBucket?: CompanySize;
  country?: string;
  minScore?: number;
  isFavorited?: boolean;
  isArchived?: boolean;
  search?: string; // Search by company name or domain
  page?: number;
  pageSize?: number;
}

export interface UpdateLeadInput {
  companyId: string;
  userId: string;
  isFavorited?: boolean;
  isArchived?: boolean;
  notes?: string;
}

/**
 * Get all leads (companies with contacts) for a user with filtering and pagination
 */
export async function getLeads(filters: LeadFilters) {
  const {
    userId,
    industry,
    sizeBucket,
    country,
    minScore,
    isFavorited,
    isArchived = false, // Default to exclude archived
    search,
    page = 1,
    pageSize = 50,
  } = filters;

  logger.info("Fetching leads with filters", { userId, filters });

  // Build where clause
  const where: any = {
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
  const totalCount = await prisma.company.count({ where });

  // Fetch companies with contacts
  const companies = await prisma.company.findMany({
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

  logger.info("Fetched leads", {
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
export async function getLeadById(companyId: string, userId: string) {
  logger.info("Fetching lead by ID", { companyId, userId });

  const company = await prisma.company.findFirst({
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
export async function updateLead(input: UpdateLeadInput) {
  const { companyId, userId, isFavorited, isArchived, notes } = input;

  logger.info("Updating lead", { companyId, userId, updates: input });

  // Verify user has access to this company
  const company = await prisma.company.findFirst({
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
  const updated = await prisma.company.update({
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

  logger.info("Lead updated", { companyId, userId });

  return updated;
}

/**
 * Get unique industries from user's leads for filter dropdown
 */
export async function getLeadIndustries(userId: string) {
  const companies = await prisma.company.findMany({
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
export async function getLeadCountries(userId: string) {
  const companies = await prisma.company.findMany({
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
export async function getLeadStats(userId: string) {
  const [
    totalLeads,
    favoritedLeads,
    archivedLeads,
    companiesWithContacts,
    avgScore,
  ] = await Promise.all([
    prisma.company.count({
      where: {
        leadSearches: {
          some: { userId },
        },
        isArchived: false,
      },
    }),
    prisma.company.count({
      where: {
        leadSearches: {
          some: { userId },
        },
        isFavorited: true,
        isArchived: false,
      },
    }),
    prisma.company.count({
      where: {
        leadSearches: {
          some: { userId },
        },
        isArchived: true,
      },
    }),
    prisma.company.count({
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
    prisma.company.aggregate({
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
