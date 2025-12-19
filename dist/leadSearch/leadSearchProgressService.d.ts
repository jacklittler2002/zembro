/**
 * Checks if a LeadSearch is complete and marks as DONE if so.
 *
 * Completion criteria:
 * - discoveredCount > 0
 * - crawledCount >= discoveredCount OR no crawl jobs remaining
 * - enrichedCount >= crawledCount OR no enrichment jobs remaining
 * - status is RUNNING
 */
export declare function maybeMarkLeadSearchDone(leadSearchId: string): Promise<void>;
//# sourceMappingURL=leadSearchProgressService.d.ts.map