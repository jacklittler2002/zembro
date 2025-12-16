import { prisma } from "../db";
import { enqueueJob } from "../jobs/jobService";
import { logger } from "../logger";
import { getUserPlanCode } from "../monetization/getPlan";
import { clampByPlan, getEntitlements, requireCredits, PlanLimitError } from "../monetization/enforce";

export interface CreateLeadSearchInput {
  userId?: string;
  query: string;
  maxLeads?: number;
  filters?: any; // Json
}

/**
 * Create a new LeadSearch and immediately enqueue a DISCOVERY job
 */
export async function createLeadSearch(input: CreateLeadSearchInput) {
  const plan = await getUserPlanCode(input.userId!);
  const ent = getEntitlements(plan);

  const activeCount = await prisma.leadSearch.count({
    where: {
      userId: input.userId!,
      status: { in: ["PENDING", "RUNNING"] },
    },
  });
  if (activeCount >= ent.maxActiveSearches) {
    throw new PlanLimitError({ limit: "maxActiveSearches", allowed: ent.maxActiveSearches });
  }

  const cappedMaxLeads = clampByPlan(plan, input.maxLeads || 100, "maxLeadsPerSearch");

  // Charge campaign start credits (soft wall)
  await requireCredits(input.userId!, 25, "LEAD_SEARCH_START");

  const leadSearch = await prisma.leadSearch.create({
    data: {
      userId: input.userId!,
      query: input.query,
      maxLeads: cappedMaxLeads,
      status: "PENDING",
      filters: input.filters || null,
    },
  });

  logger.info(`Created LeadSearch ${leadSearch.id} for query: ${input.query}`);

  // Immediately enqueue DISCOVERY job
  await enqueueJob({
    type: "DISCOVERY",
    leadSearchId: leadSearch.id,
    targetUrl: null,
  });

  logger.info(`Enqueued DISCOVERY job for LeadSearch ${leadSearch.id}`);

  return leadSearch;
}

/**
 * Get a LeadSearch by ID
 */
export async function getLeadSearchById(id: string) {
  return await prisma.leadSearch.findUnique({
    where: { id },
  });
}

/**
 * Update LeadSearch status
 */
export async function markLeadSearchStatus(
  id: string,
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED",
  errorMessage?: string
) {
  await prisma.leadSearch.update({
    where: { id },
    data: {
      status,
      errorMessage: errorMessage || null,
    },
  });

  logger.info(`Updated LeadSearch ${id} to status: ${status}`);
}

export interface LeadSearchLeadOptions {
  limit?: number;
  minScore?: number; // use aiConfidence from Company
  industry?: string;
  sizeBucket?: string; // MICRO, SMALL, SMB, MIDMARKET, ENTERPRISE
  country?: string;
  decisionMakerOnly?: boolean;
  excludePreviousExports?: boolean; // NEW: Exclude leads user has already exported
  userId?: string; // NEW: Required when excludePreviousExports is true
  jobTitle?: string; // NEW: filter by contact role/job title
  techStack?: string[]; // NEW: filter by company tech stack
  fundingStage?: string; // NEW: filter by company funding stage
}

/**
 * Get all leads (contacts) associated with a LeadSearch with advanced filtering
 * 
 * TODO: More precise linking between LeadSearch and Company (currently uses relation)
 * TODO: Plan-based limits for different subscription tiers
 * TODO: Add caching for expensive queries
 */
export async function getLeadSearchLeads(
  id: string,
  options: LeadSearchLeadOptions = {}
): Promise<
  Array<{
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string;
    websiteUrl: string | null;
    city: string | null;
    country: string | null;
    niche: string | null;
    industry: string | null;
    sizeBucket: string | null;
    role: string | null;
    isDecisionMaker: boolean;
    score: number | null;
  }>
> {
  // If user wants to exclude previous exports, fetch their export history
  let exportedCompanyIds: string[] = [];
  if (options.excludePreviousExports && options.userId) {
    const previousExports = await prisma.leadExport.findMany({
      where: { userId: options.userId },
      select: { companyId: true },
    });
    exportedCompanyIds = previousExports.map((exp: { companyId: string }) => exp.companyId);
    
    logger.info(`Excluding ${exportedCompanyIds.length} previously exported companies for user ${options.userId}`);
  }

  const leadSearch = await prisma.leadSearch.findUnique({
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
          ...(options.sizeBucket ? { sizeBucket: options.sizeBucket as any } : {}),
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

  const leads: Array<{
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string;
    websiteUrl: string | null;
    city: string | null;
    country: string | null;
    niche: string | null;
    industry: string | null;
    sizeBucket: string | null;
    role: string | null;
    isDecisionMaker: boolean;
    score: number | null;
  }> = [];

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
