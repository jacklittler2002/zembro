import { config } from "./config";
import { logger } from "./logger";
import { prisma } from "./db";
import { startHttpServer } from "./httpServer";
import { PolicyRegistry } from "./policies/policyRegistry";

async function bootstrap() {
  logger.info(`${config.appName} starting in ${config.env} mode`);

  // Initialize policy system
  logger.info("Initializing policy system...");
  await PolicyRegistry.initialize(prisma);
  logger.info("✓ Policy system initialized");

  // Database connection check with retry
  try {
    logger.info("Connecting to database...");
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as startup_check`;
    logger.info("✓ Database connection OK");
  } catch (err: any) {
    logger.error("✗ Database connection failed:", err?.message ?? err);
    logger.error("Check your DATABASE_URL in .env file");
    logger.error("Run 'npm run db:doctor' for diagnostics");
    
    // In development, warn but continue. In production, you may want to exit.
    if (config.env === "production") {
      throw err;
    } else {
      logger.warn("⚠ Continuing without database in development mode...");
    }
  }

  // Start HTTP API server
  startHttpServer(config.port);
  logger.info(`HTTP API server started on port ${config.port}`);

  logger.info("Bootstrap complete. HTTP server running.");
}

bootstrap().catch((err) => {
  logger.error("Fatal error in bootstrap()", err);
  process.exit(1);
});
