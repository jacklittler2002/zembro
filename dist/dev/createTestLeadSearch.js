"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const logger_1 = require("../logger");
const leadSearchService_1 = require("../leadSearch/leadSearchService");
async function main() {
    logger_1.logger.info("Creating test LeadSearch...");
    const leadSearch = await (0, leadSearchService_1.createLeadSearch)({
        userId: "test-user-123",
        query: "dentists in London",
        maxLeads: 50,
    });
    logger_1.logger.info("✅ Created LeadSearch:", leadSearch.id);
    logger_1.logger.info("✅ DISCOVERY job enqueued automatically");
    logger_1.logger.info("\nWait for the pipeline to complete, then export with:");
    logger_1.logger.info(`curl http://localhost:4000/api/lead-searches/${leadSearch.id}/export`);
    process.exit(0);
}
main().catch((err) => {
    logger_1.logger.error("Failed to create test LeadSearch", err);
    process.exit(1);
});
//# sourceMappingURL=createTestLeadSearch.js.map