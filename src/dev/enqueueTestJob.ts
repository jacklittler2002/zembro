import "dotenv/config";
import { enqueueJob } from "../jobs/jobService";
import { logger } from "../logger";

async function main() {
  logger.info("Enqueuing test job...");
  
  await enqueueJob({
    type: "DISCOVERY",
    targetUrl: "https://example.com",
    priority: 10,
  });

  logger.info("Test job enqueued successfully!");
  process.exit(0);
}

main().catch((err) => {
  logger.error("Failed to enqueue test job", err);
  process.exit(1);
});
