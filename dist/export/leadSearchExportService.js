"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLeadSearchToCsv = exportLeadSearchToCsv;
const leadSearchService_1 = require("../leadSearch/leadSearchService");
const csvExport_1 = require("./csvExport");
const logger_1 = require("../logger");
const db_1 = require("../db");
/**
 * Export a LeadSearch to CSV format and track which leads were exported
 *
 * @param leadSearchId - ID of the lead search to export
 * @param userId - User ID to track exports for deduplication
 * @param options - Export options (filters, etc.)
 */
async function exportLeadSearchToCsv(leadSearchId, userId, options = {}) {
    // 1. Load lead search
    const leadSearch = await (0, leadSearchService_1.getLeadSearchById)(leadSearchId);
    if (!leadSearch) {
        throw new Error(`LeadSearch ${leadSearchId} not found`);
    }
    logger_1.logger.info(`Exporting LeadSearch ${leadSearchId} to CSV (status: ${leadSearch.status})`);
    // 2. Fetch leads (with enriched data and exclusions)
    const leads = await (0, leadSearchService_1.getLeadSearchLeads)(leadSearchId, {
        ...(options.excludePreviousExports !== undefined && { excludePreviousExports: options.excludePreviousExports }),
        ...(userId !== undefined && { userId }),
    });
    // 3. Map to CsvLeadRow[] with enriched fields
    const csvRows = leads.map((lead) => ({
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
    const csv = (0, csvExport_1.leadsToCsv)(csvRows);
    logger_1.logger.info(`Exported ${csvRows.length} leads from LeadSearch ${leadSearchId}`);
    return csv;
}
/**
 * Record which leads a user has exported to prevent duplicates in future searches
 */
async function trackLeadExports(userId, leadSearchId, leads) {
    // Get company IDs from the lead search's companies
    const leadSearchWithCompanies = await db_1.prisma.leadSearch.findUnique({
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
        logger_1.logger.warn(`Could not track exports - LeadSearch ${leadSearchId} not found`);
        return;
    }
    const exportRecords = [];
    for (const company of leadSearchWithCompanies.companies) {
        for (const contact of company.contacts) {
            // Check if this contact was included in the export
            const wasExported = leads.some(lead => lead.email === contact.email && lead.companyName === company.name);
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
        await db_1.prisma.leadExport.createMany({
            data: exportRecords,
            skipDuplicates: true, // Avoid duplicate exports from being recorded twice
        });
        logger_1.logger.info(`Tracked ${exportRecords.length} lead exports for user ${userId} from LeadSearch ${leadSearchId}`);
    }
}
//# sourceMappingURL=leadSearchExportService.js.map