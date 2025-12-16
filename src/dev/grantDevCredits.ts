import { prisma } from "../db.js";
import { addCredits } from "../ted/creditService.js";
import { logger } from "../logger.js";

async function grantDevCredits() {
  try {
    // Find the first user (should be you as the dev)
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!user) {
      console.error("No users found in database. Please create a user first.");
      process.exit(1);
    }

    console.log(`\nGranting 100,000 credits to user: ${user.email} (${user.id})`);
    
    // Grant 100k credits
    await addCredits(
      user.id,
      100000,
      "DEV_GRANT",
      { type: "development_testing", grantedBy: "dev_script" }
    );

    // Verify new balance
    const wallet = await prisma.aiCreditWallet.findUnique({
      where: { userId: user.id },
    });

    console.log(`✅ Success! New balance: ${wallet?.balance.toLocaleString()} credits\n`);
    
  } catch (error: any) {
    console.error("Error granting dev credits:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

grantDevCredits();
