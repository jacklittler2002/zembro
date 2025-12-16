"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueJob = enqueueJob;
exports.fetchNextPendingJob = fetchNextPendingJob;
exports.markJobDone = markJobDone;
exports.markJobFailed = markJobFailed;
const db_1 = require("../db");
const logger_1 = require("../logger");
async function enqueueJob(params) {
    const job = await db_1.prisma.crawlJob.create({
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
    logger_1.logger.info("Enqueued job", job.id, job.type);
    return job;
}
async function fetchNextPendingJob() {
    const now = new Date();
    const job = await db_1.prisma.crawlJob.findFirst({
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
    if (!job)
        return null;
    const updated = await db_1.prisma.crawlJob.update({
        where: { id: job.id },
        data: {
            status: "RUNNING",
            startedAt: now,
            attempts: job.attempts + 1,
        },
    });
    return updated;
}
async function markJobDone(id) {
    await db_1.prisma.crawlJob.update({
        where: { id },
        data: {
            status: "DONE",
            finishedAt: new Date(),
            lastError: null,
        },
    });
}
async function markJobFailed(id, error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    await db_1.prisma.crawlJob.update({
        where: { id },
        data: {
            status: "FAILED",
            finishedAt: new Date(),
            lastError: message,
        },
    });
    // This is also a good place for metrics/alerts later
}
//# sourceMappingURL=jobService.js.map