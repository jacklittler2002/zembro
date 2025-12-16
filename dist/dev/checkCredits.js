"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = require("../db.js");
async function checkCredits() {
    try {
        const users = await db_js_1.prisma.user.findMany({ take: 5 });
        console.log("\n=== Users & Credits ===\n");
        for (const user of users) {
            const wallet = await db_js_1.prisma.aiCreditWallet.findUnique({
                where: { userId: user.id },
                include: {
                    transactions: {
                        orderBy: { createdAt: "desc" },
                        take: 3,
                    }
                },
            });
            console.log(`📧 Email: ${user.email}`);
            console.log(`   Balance: ${wallet?.balance ?? 0} credits`);
            if (wallet?.transactions.length) {
                console.log(`   Recent transactions:`);
                wallet.transactions.forEach(t => {
                    console.log(`     - ${t.reason}: ${t.change > 0 ? '+' : ''}${t.change} credits`);
                });
            }
            console.log();
        }
    }
    catch (error) {
        console.error("Error:", error);
    }
    finally {
        await db_js_1.prisma.$disconnect();
    }
}
checkCredits();
//# sourceMappingURL=checkCredits.js.map