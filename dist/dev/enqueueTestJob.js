"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const jobService_1 = require("../jobs/jobService");
const logger_1 = require("../logger");
async function main() {
    logger_1.logger.info("Enqueuing test job...");
    await (0, jobService_1.enqueueJob)({
        type: "DISCOVERY",
        targetUrl: "https://example.com",
        priority: 10,
    });
    logger_1.logger.info("Test job enqueued successfully!");
    process.exit(0);
}
main().catch((err) => {
    logger_1.logger.error("Failed to enqueue test job", err);
    process.exit(1);
});
//# sourceMappingURL=enqueueTestJob.js.map