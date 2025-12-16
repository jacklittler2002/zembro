import { logger } from "../logger";
import { runDiscoveryForLeadSearch } from "./discoveryService";
import { CrawlJob } from "../jobs/jobTypes";

export async function handleDiscovery(job: CrawlJob) {
  if (!job.leadSearchId) {
    logger.warn("DISCOVERY job without leadSearchId", job.id);
    return;
  }

  await runDiscoveryForLeadSearch(job.leadSearchId);
}
