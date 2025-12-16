import { logger } from "../logger";
import { createLeadSearch, getLeadSearchById, getLeadSearchLeads } from "../leadSearch/leadSearchService";
import { getCreditBalance } from "./creditService";
import { exportLeadSearchToCsv } from "../export/leadSearchExportService";
import { prisma } from "../db";

/**
 * Execute a tool call from GPT-4o
 * 
 * Takes the function name and arguments from GPT, runs the actual backend logic,
 * and returns results in a format GPT can understand.
 */
export async function executeTool(
  userId: string,
  toolName: string,
  args: any
): Promise<string> {
  logger.info(`TED executing tool: ${toolName}`, { userId, args });

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
      
        case "create_campaign":
          return await handleCreateCampaign(userId, args);
        case "import_leads_to_campaign":
          return await handleImportLeadsToCampaign(userId, args);
        case "update_campaign_status":
          return await handleUpdateCampaignStatus(userId, args);
        case "get_campaign_stats":
          return await handleGetCampaignStats(userId, args);
        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` });

  // --- Campaign/Outreach handlers ---
  async function handleCreateCampaign(userId: string, args: any) {
    const { name, emailAccountIds, leadSearchId, listId, steps, scheduleStartAt, scheduleEndAt, sendTimeStart, sendTimeEnd, timezone, dailyLimit } = args;
    const { createCampaign } = await import("../email/campaignService");
    const campaign = await createCampaign({
      userId,
      name,
      emailAccountIds,
      leadSearchId,
      listId,
      steps,
      scheduleStartAt: scheduleStartAt ? new Date(scheduleStartAt) : undefined,
      scheduleEndAt: scheduleEndAt ? new Date(scheduleEndAt) : undefined,
      sendTimeStart,
      sendTimeEnd,
      timezone,
      dailyLimit,
    });
    return JSON.stringify({ success: true, campaignId: campaign.id, name: campaign.name });
  }

  async function handleImportLeadsToCampaign(userId: string, args: any) {
    const { campaignId, ...options } = args;
    const { importLeadsFromSearch } = await import("../email/campaignService");
    const result = await importLeadsFromSearch(campaignId, userId, options);
    return JSON.stringify({ success: true, ...result });
  }

  async function handleUpdateCampaignStatus(userId: string, args: any) {
    const { campaignId, status } = args;
    const { updateCampaignStatus } = await import("../email/campaignService");
    await updateCampaignStatus(campaignId, userId, status);
    return JSON.stringify({ success: true, campaignId, status });
  }

  async function handleGetCampaignStats(userId: string, args: any) {
    const { campaignId } = args;
    const { getCampaignStats } = await import("../email/emailSendingService");
    const stats = await getCampaignStats(campaignId);
    return JSON.stringify({ success: true, campaignId, stats });
  }
      
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error: any) {
    logger.error(`Error executing tool ${toolName}:`, error);
    return JSON.stringify({
      error: error.message || "Tool execution failed",
    });
  }
}

async function handleCreateLeadSearch(userId: string, args: any) {
  const { query, maxLeads = 100 } = args;

  const leadSearch = await createLeadSearch({
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

async function handleGetLeadSearchStatus(userId: string, args: any) {
  const { leadSearchId } = args;

  const leadSearch = await getLeadSearchById(leadSearchId);

  if (!leadSearch) {
    return JSON.stringify({ error: "Lead search not found" });
  }

  if (leadSearch.userId !== userId) {
    return JSON.stringify({ error: "Unauthorized - lead search belongs to another user" });
  }

  // Count companies found
  const companiesCount = await prisma.company.count({
    where: {
      leadSearches: {
        some: {
          id: leadSearchId,
        },
      },
    },
  });

  // Count contacts found
  const contactsCount = await prisma.contact.count({
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

async function handleGetLeads(userId: string, args: any) {
  const {
    leadSearchId,
    minScore,
    industry,
    sizeBucket,
    country,
    decisionMakerOnly = false,
    excludePreviousExports = true,
    limit,
  } = args;

  const leadSearch = await getLeadSearchById(leadSearchId);

  if (!leadSearch) {
    return JSON.stringify({ error: "Lead search not found" });
  }

  if (leadSearch.userId !== userId) {
    return JSON.stringify({ error: "Unauthorized" });
  }

  const leads = await getLeadSearchLeads(leadSearchId, {
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

async function handleExportLeadsToCsv(userId: string, args: any) {
  const { leadSearchId, excludePreviousExports = true } = args;

  const leadSearch = await getLeadSearchById(leadSearchId);

  if (!leadSearch) {
    return JSON.stringify({ error: "Lead search not found" });
  }

  if (leadSearch.userId !== userId) {
    return JSON.stringify({ error: "Unauthorized" });
  }

  const csv = await exportLeadSearchToCsv(leadSearchId, userId, {
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

async function handleGetCreditBalance(userId: string) {
  const balance = await getCreditBalance(userId);

  return JSON.stringify({
    balance,
    message: `You have ${balance} credits remaining.`,
  });
}

async function handleEstimateCredits(args: any) {
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

async function handleListUserLeadSearches(userId: string, args: any) {
  const { limit = 10 } = args;

  const searches = await prisma.leadSearch.findMany({
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
