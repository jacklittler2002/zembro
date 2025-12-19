"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const logger_1 = require("../logger");
const creditService_js_1 = require("../ted/creditService.js");
const TEST_USER_ID = "test-user-123";
const INITIAL_CREDITS = 100;
async function main() {
    logger_1.logger.info(`Granting ${INITIAL_CREDITS} initial credits to user: ${TEST_USER_ID}`);
    await (0, creditService_js_1.addCredits)(TEST_USER_ID, INITIAL_CREDITS, "Initial credit grant for testing", { source: "seed script" });
    logger_1.logger.info(`✅ Successfully granted ${INITIAL_CREDITS} credits to ${TEST_USER_ID}`);
    process.exit(0);
}
main().catch((err) => {
    logger_1.logger.error("Error granting credits", err);
    process.exit(1);
});
//# sourceMappingURL=grantInitialTedCredits.js.map