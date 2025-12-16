import {
  getLeadSearchById,
  getLeadSearchLeads,
} from "../leadSearch/leadSearchService";
import { leadsToCsv, CsvLeadRow } from "./csvExport";
import { logger } from "../logger";
import { prisma } from "../db";

/**
 * Export a LeadSearch to CSV format and track which leads were exported
 * 
 * @param leadSearchId - ID of the lead search to export
 * @param userId - User ID to track exports for deduplication
 * @param options - Export options (filters, etc.)
 */
export async function exportLeadSearchToCsv(
  leadSearchId: string,
  userId?: string,
  options: {
    excludePreviousExports?: boolean;
  } = {}
): Promise<string> {
  // 1. Load lead search
  const leadSearch = await getLeadSearchById(leadSearchId);

  if (!leadSearch) {
    throw new Error(`LeadSearch ${leadSearchId} not found`);
  }

  logger.info(
    `Exporting LeadSearch ${leadSearchId} to CSV (status: ${leadSearch.status})`
  );

  // 2. Fetch leads (with enriched data and exclusions)
  const leads = await getLeadSearchLeads(leadSearchId, {
    ...(options.excludePreviousExports !== undefined && { excludePreviousExports: options.excludePreviousExports }),
    ...(userId !== undefined && { userId }),
  });

  // 3. Map to CsvLeadRow[] with enriched fields
  const csvRows: CsvLeadRow[] = leads.map((lead) => ({
    email: lead.email,
    first_name: lead.firstName || "",
    last_name: lead.lastName || "",
    company: lead.companyName,
    website: lead.websiteUrl || "",
    city: lead.city || "",
    country: lead.country || "",
    niche: lead.niche || "",
    industry: lead.industry || "",
    size_bucket: lead.sizeBucket || "",
    role: lead.role || "",
    decision_maker: lead.isDecisionMaker ? "yes" : "no",
  }));

  // 4. Track exports for deduplication (if userId provided)
  if (userId) {
    await trackLeadExports(userId, leadSearchId, leads);
  }

  // 5. Return CSV string
  const csv = leadsToCsv(csvRows);

  logger.info(
    `Exported ${csvRows.length} leads from LeadSearch ${leadSearchId}`
  );

  return csv;
}

/**
 * Record which leads a user has exported to prevent duplicates in future searches
 */
async function trackLeadExports(
  userId: string,
  leadSearchId: string,
  leads: Array<{ email: string; companyName: string }>
) {
  // Get company IDs from the lead search's companies
  const leadSearchWithCompanies = await prisma.leadSearch.findUnique({
    where: { id: leadSearchId },
    include: {
      companies: {
        include: {
          contacts: true,
        },
      },
    },
  });

  if (!leadSearchWithCompanies) {
    logger.warn(`Could not track exports - LeadSearch ${leadSearchId} not found`);
    return;
  }

  const exportRecords = [];

  for (const company of leadSearchWithCompanies.companies) {
    for (const contact of company.contacts) {
      // Check if this contact was included in the export
      const wasExported = leads.some(
        lead => lead.email === contact.email && lead.companyName === company.name
      );

      if (wasExported) {
        exportRecords.push({
          userId,
          companyId: company.id,
          contactId: contact.id,
          leadSearchId,
        });
      }
    }
  }

  // Bulk create export records (using createMany with skipDuplicates)
  if (exportRecords.length > 0) {
    await prisma.leadExport.createMany({
      data: exportRecords,
      skipDuplicates: true, // Avoid duplicate exports from being recorded twice
    });

    logger.info(
      `Tracked ${exportRecords.length} lead exports for user ${userId} from LeadSearch ${leadSearchId}`
    );
  }
}
