import "dotenv/config";
import { logger } from "./logger";
import http from "http";
import { config } from "./config";
import {
  fetchNextPendingJob,
  markJobDone,
  markJobFailed,
} from "./jobs/jobService";
import { CrawlJob } from "./jobs/jobTypes";
import { handleDiscovery } from "./discovery/handleDiscovery";
import { handleSiteCrawl } from "./crawler/handleSiteCrawl";
import { handleEnrichmentJob } from "./enrichment/handleEnrichmentJob";
import { processEmailQueue } from "./email/emailSendingService";

const POLL_INTERVAL_MS = 2000;
const EMAIL_QUEUE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleJob(job: CrawlJob) {
  logger.info("Handling job", job.id, job.type, job.targetUrl);

  switch (job.type) {
    case "DISCOVERY":
      await handleDiscovery(job);
      break;

    case "SITE_CRAWL":
      await handleSiteCrawl(job);
      break;

    case "ENRICHMENT":
      await handleEnrichmentJob(job);
      break;

    default:
      logger.warn("Unknown job type", job.type);
      break;
  }
}


async function workerLoop() {
  logger.info(`Zembro worker starting in ${config.env} mode`);

  // Start email queue processor in background
  startEmailQueueProcessor();

  const concurrency = Number(process.env.WORKER_CONCURRENCY || 1);
  logger.info(`Worker concurrency: ${concurrency}`);

  // Launch N concurrent job loops
  const loops = Array.from({ length: concurrency }, (_, i) =>
    (async function jobLoop(idx: number) {
      logger.info(`Job loop #${idx + 1} started`);
      while (true) {
        try {
          const job = await fetchNextPendingJob();
          if (!job) {
            await sleep(POLL_INTERVAL_MS);
            continue;
          }
          try {
            await handleJob(job);
            await markJobDone(job.id);
          } catch (err) {
            logger.error(`Error in job loop #${idx + 1} handling job`, job.id, err);
            await markJobFailed(job.id, err);
          }
        } catch (err) {
          logger.error(`Worker loop error in job loop #${idx + 1}`, err);
          await sleep(POLL_INTERVAL_MS);
        }
      }
    })(i)
  );
  await Promise.all(loops);
}

/**
 * Background processor for email campaign queue
 * Runs every 5 minutes to send scheduled emails
 */
async function startEmailQueueProcessor() {
  logger.info("Email queue processor starting");

  while (true) {
    try {
      await processEmailQueue();
    } catch (err) {
      logger.error("Error in email queue processor", err);
    }

    await sleep(EMAIL_QUEUE_INTERVAL_MS);
  }
}


// Health check HTTP server for worker
const healthPort = Number(process.env.WORKER_HEALTH_PORT || 3002);
http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }
  res.writeHead(404);
  res.end();
}).listen(healthPort, () => {
  logger.info(`Worker health listening on ${healthPort}`);
});

workerLoop().catch((err) => {
  logger.error("Fatal worker error", err);
  process.exit(1);
});
