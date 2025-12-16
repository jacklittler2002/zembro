import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Database Doctor ===");
  console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
  console.log("DIRECT_URL present:", !!process.env.DIRECT_URL);
  
  if (process.env.DATABASE_URL) {
    // Hide password but show structure
    const url = process.env.DATABASE_URL.replace(/:[^@]+@/, ":****@");
    console.log("DATABASE_URL format:", url);
  }

  try {
    console.log("\nAttempting to connect...");
    await prisma.$connect();
    console.log("✓ Connection established");
    
    console.log("\nRunning test query...");
    const result = await prisma.$queryRaw`SELECT now() as now, version() as version`;
    console.log("✓ DB OK:", result);
    
    console.log("\n✅ Database connection is healthy!");
  } catch (err: any) {
    console.error("\n❌ DB ERROR:", err?.message ?? err);
    console.error("\nError code:", err?.code);
    console.error("Error details:", err?.meta);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
