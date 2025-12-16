/**
 * Export a LeadSearch to CSV format and track which leads were exported
 *
 * @param leadSearchId - ID of the lead search to export
 * @param userId - User ID to track exports for deduplication
 * @param options - Export options (filters, etc.)
 */
export declare function exportLeadSearchToCsv(leadSearchId: string, userId?: string, options?: {
    excludePreviousExports?: boolean;
}): Promise<string>;
//# sourceMappingURL=leadSearchExportService.d.ts.map