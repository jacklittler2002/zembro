import "dotenv/config";
import { logger } from "../logger";
import { createLeadSearch } from "../leadSearch/leadSearchService";

async function main() {
  logger.info("Creating test LeadSearch...");

  const leadSearch = await createLeadSearch({
    userId: "test-user-123",
    query: "dentists in London",
    maxLeads: 50,
  });

  logger.info("✅ Created LeadSearch:", leadSearch.id);
  logger.info("✅ DISCOVERY job enqueued automatically");
  logger.info(
    "\nWait for the pipeline to complete, then export with:"
  );
  logger.info(
    `curl http://localhost:4000/api/lead-searches/${leadSearch.id}/export`
  );

  process.exit(0);
}

main().catch((err) => {
  logger.error("Failed to create test LeadSearch", err);
  process.exit(1);
});
