import { prisma } from "../db";
import { logger } from "../logger";

/**
 * Checks if a LeadSearch is complete and marks as DONE if so.
 *
 * Completion criteria:
 * - discoveredCount > 0
 * - crawledCount >= discoveredCount OR no crawl jobs remaining
 * - enrichedCount >= crawledCount OR no enrichment jobs remaining
 * - status is RUNNING
 */
export async function maybeMarkLeadSearchDone(leadSearchId: string) {
  const ls = await prisma.leadSearch.findUnique({ where: { id: leadSearchId } });

  if (!ls || ls.status !== "RUNNING") return;

  // Patch: cast ls as any to allow discoveredCount, crawledCount, enrichedCount
  const lsAny = ls as any;
  if (lsAny.discoveredCount === 0) return;

  // Count remaining crawl jobs
  const crawlJobsRemaining = await prisma.crawlJob.count({
    where: {
      leadSearchId,
      type: "SITE_CRAWL",
      status: { in: ["PENDING", "RUNNING"] },
    },
  });

  // Count remaining enrichment jobs
  const enrichmentJobsRemaining = await prisma.crawlJob.count({
    where: {
      leadSearchId,
      type: "ENRICHMENT",
      status: { in: ["PENDING", "RUNNING"] },
    },
  });


  const crawlsDone = lsAny.crawledCount >= lsAny.discoveredCount || crawlJobsRemaining === 0;
  const enrichDone = lsAny.enrichedCount >= lsAny.crawledCount || enrichmentJobsRemaining === 0;

  if (crawlsDone && enrichDone) {
    await prisma.leadSearch.update({
      where: { id: leadSearchId },
      data: { status: "DONE" },
    });
    logger.info(`LeadSearch ${leadSearchId} marked as DONE`);
  }
}
