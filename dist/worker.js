"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const logger_1 = require("./logger");
const config_1 = require("./config");
const jobService_1 = require("./jobs/jobService");
const handleDiscovery_1 = require("./discovery/handleDiscovery");
const handleSiteCrawl_1 = require("./crawler/handleSiteCrawl");
const handleEnrichmentJob_1 = require("./enrichment/handleEnrichmentJob");
const emailSendingService_1 = require("./email/emailSendingService");
const POLL_INTERVAL_MS = 2000;
const EMAIL_QUEUE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function handleJob(job) {
    logger_1.logger.info("Handling job", job.id, job.type, job.targetUrl);
    switch (job.type) {
        case "DISCOVERY":
            await (0, handleDiscovery_1.handleDiscovery)(job);
            break;
        case "SITE_CRAWL":
            await (0, handleSiteCrawl_1.handleSiteCrawl)(job);
            break;
        case "ENRICHMENT":
            await (0, handleEnrichmentJob_1.handleEnrichmentJob)(job);
            break;
        default:
            logger_1.logger.warn("Unknown job type", job.type);
            break;
    }
}
async function workerLoop() {
    logger_1.logger.info(`Zembro worker starting in ${config_1.config.env} mode`);
    // Start email queue processor in background
    startEmailQueueProcessor();
    while (true) {
        try {
            const job = await (0, jobService_1.fetchNextPendingJob)();
            if (!job) {
                await sleep(POLL_INTERVAL_MS);
                continue;
            }
            try {
                await handleJob(job);
                await (0, jobService_1.markJobDone)(job.id);
            }
            catch (err) {
                logger_1.logger.error("Error while handling job", job.id, err);
                await (0, jobService_1.markJobFailed)(job.id, err);
            }
        }
        catch (err) {
            logger_1.logger.error("Worker loop error", err);
            await sleep(POLL_INTERVAL_MS);
        }
    }
}
/**
 * Background processor for email campaign queue
 * Runs every 5 minutes to send scheduled emails
 */
async function startEmailQueueProcessor() {
    logger_1.logger.info("Email queue processor starting");
    while (true) {
        try {
            await (0, emailSendingService_1.processEmailQueue)();
        }
        catch (err) {
            logger_1.logger.error("Error in email queue processor", err);
        }
        await sleep(EMAIL_QUEUE_INTERVAL_MS);
    }
}
workerLoop().catch((err) => {
    logger_1.logger.error("Fatal worker error", err);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map