"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeMarkLeadSearchDone = maybeMarkLeadSearchDone;
const db_1 = require("../db");
const logger_1 = require("../logger");
/**
 * Checks if a LeadSearch is complete and marks as DONE if so.
 *
 * Completion criteria:
 * - discoveredCount > 0
 * - crawledCount >= discoveredCount OR no crawl jobs remaining
 * - enrichedCount >= crawledCount OR no enrichment jobs remaining
 * - status is RUNNING
 */
async function maybeMarkLeadSearchDone(leadSearchId) {
    const ls = await db_1.prisma.leadSearch.findUnique({ where: { id: leadSearchId } });
    if (!ls || ls.status !== "RUNNING")
        return;
    // Patch: cast ls as any to allow discoveredCount, crawledCount, enrichedCount
    const lsAny = ls;
    if (lsAny.discoveredCount === 0)
        return;
    // Count remaining crawl jobs
    const crawlJobsRemaining = await db_1.prisma.crawlJob.count({
        where: {
            leadSearchId,
            type: "SITE_CRAWL",
            status: { in: ["PENDING", "RUNNING"] },
        },
    });
    // Count remaining enrichment jobs
    const enrichmentJobsRemaining = await db_1.prisma.crawlJob.count({
        where: {
            leadSearchId,
            type: "ENRICHMENT",
            status: { in: ["PENDING", "RUNNING"] },
        },
    });
    const crawlsDone = lsAny.crawledCount >= lsAny.discoveredCount || crawlJobsRemaining === 0;
    const enrichDone = lsAny.enrichedCount >= lsAny.crawledCount || enrichmentJobsRemaining === 0;
    if (crawlsDone && enrichDone) {
        await db_1.prisma.leadSearch.update({
            where: { id: leadSearchId },
            data: { status: "DONE" },
        });
        logger_1.logger.info(`LeadSearch ${leadSearchId} marked as DONE`);
    }
}
//# sourceMappingURL=leadSearchProgressService.js.map