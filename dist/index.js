"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const logger_1 = require("./logger");
const db_1 = require("./db");
const httpServer_1 = require("./httpServer");
const policyRegistry_1 = require("./policies/policyRegistry");
async function bootstrap() {
    logger_1.logger.info(`${config_1.config.appName} starting in ${config_1.config.env} mode`);
    // Initialize policy system
    logger_1.logger.info("Initializing policy system...");
    await policyRegistry_1.PolicyRegistry.initialize(db_1.prisma);
    logger_1.logger.info("✓ Policy system initialized");
    // Database connection check with retry
    try {
        logger_1.logger.info("Connecting to database...");
        await db_1.prisma.$connect();
        await db_1.prisma.$queryRaw `SELECT 1 as startup_check`;
        logger_1.logger.info("✓ Database connection OK");
    }
    catch (err) {
        logger_1.logger.error("✗ Database connection failed:", err?.message ?? err);
        logger_1.logger.error("Check your DATABASE_URL in .env file");
        logger_1.logger.error("Run 'npm run db:doctor' for diagnostics");
        // In development, warn but continue. In production, you may want to exit.
        if (config_1.config.env === "production") {
            throw err;
        }
        else {
            logger_1.logger.warn("⚠ Continuing without database in development mode...");
        }
    }
    // Start HTTP API server
    (0, httpServer_1.startHttpServer)(config_1.config.port);
    logger_1.logger.info(`HTTP API server started on port ${config_1.config.port}`);
    logger_1.logger.info("Bootstrap complete. HTTP server running.");
}
bootstrap().catch((err) => {
    logger_1.logger.error("Fatal error in bootstrap()", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map