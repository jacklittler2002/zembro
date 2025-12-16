import "dotenv/config";
import { logger } from "../logger.js";
import { addCredits } from "../ted/creditService.js";

const TEST_USER_ID = "test-user-123";
const INITIAL_CREDITS = 100;

async function main() {
  logger.info(
    `Granting ${INITIAL_CREDITS} initial credits to user: ${TEST_USER_ID}`
  );

  await addCredits(
    TEST_USER_ID,
    INITIAL_CREDITS,
    "Initial credit grant for testing",
    { source: "seed script" }
  );

  logger.info(
    `✅ Successfully granted ${INITIAL_CREDITS} credits to ${TEST_USER_ID}`
  );
  process.exit(0);
}

main().catch((err) => {
  logger.error("Error granting credits", err);
  process.exit(1);
});
