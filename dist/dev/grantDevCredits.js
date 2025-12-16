"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = require("../db.js");
const creditService_js_1 = require("../ted/creditService.js");
async function grantDevCredits() {
    try {
        // Find the first user (should be you as the dev)
        const user = await db_js_1.prisma.user.findFirst({
            orderBy: { createdAt: "asc" },
        });
        if (!user) {
            console.error("No users found in database. Please create a user first.");
            process.exit(1);
        }
        console.log(`\nGranting 100,000 credits to user: ${user.email} (${user.id})`);
        // Grant 100k credits
        await (0, creditService_js_1.addCredits)(user.id, 100000, "DEV_GRANT", { type: "development_testing", grantedBy: "dev_script" });
        // Verify new balance
        const wallet = await db_js_1.prisma.aiCreditWallet.findUnique({
            where: { userId: user.id },
        });
        console.log(`✅ Success! New balance: ${wallet?.balance.toLocaleString()} credits\n`);
    }
    catch (error) {
        console.error("Error granting dev credits:", error.message);
        process.exit(1);
    }
    finally {
        await db_js_1.prisma.$disconnect();
    }
}
grantDevCredits();
//# sourceMappingURL=grantDevCredits.js.map