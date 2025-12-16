import { prisma } from "../db";
import { logger } from "../logger";
import { CrawlJob, CrawlJobStatus, CrawlJobType } from "./jobTypes";

export async function enqueueJob(params: {
  type: CrawlJobType;
  targetUrl?: string | null;
  companyId?: string | null;
  leadSearchId?: string | null;
  scheduledAt?: Date | null;
  priority?: number;
}): Promise<CrawlJob> {
  const job = await prisma.crawlJob.create({
    data: {
      type: params.type,
      status: "PENDING",
      targetUrl: params.targetUrl ?? null,
      companyId: params.companyId ?? null,
      leadSearchId: params.leadSearchId ?? null,
      scheduledAt: params.scheduledAt ?? null,
      priority: params.priority ?? 0,
    },
  });

  logger.info("Enqueued job", job.id, job.type);
  return job as unknown as CrawlJob;
}

export async function fetchNextPendingJob(): Promise<CrawlJob | null> {
  const now = new Date();

  const job = await prisma.crawlJob.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: now } },
      ],
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
  });

  if (!job) return null;

  const updated = await prisma.crawlJob.update({
    where: { id: job.id },
    data: {
      status: "RUNNING",
      startedAt: now,
      attempts: job.attempts + 1,
    },
  });

  return updated as unknown as CrawlJob;
}

export async function markJobDone(id: string): Promise<void> {
  await prisma.crawlJob.update({
    where: { id },
    data: {
      status: "DONE",
      finishedAt: new Date(),
      lastError: null,
    },
  });
}

export async function markJobFailed(id: string, error: unknown): Promise<void> {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error);

  await prisma.crawlJob.update({
    where: { id },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      lastError: message,
    },
  });

  // This is also a good place for metrics/alerts later
}
