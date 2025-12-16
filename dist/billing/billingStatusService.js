"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingStatus = getBillingStatus;
const db_1 = require("../db");
async function getBillingStatus(userId) {
    const customer = await db_1.prisma.billingCustomer.findUnique({ where: { userId } });
    const sub = await db_1.prisma.subscription.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
    });
    const wallet = await db_1.prisma.aiCreditWallet.findUnique({ where: { userId } });
    return {
        stripeCustomerId: customer?.stripeCustomerId ?? null,
        planCode: sub?.planCode ?? "FREE",
        subscriptionStatus: sub?.status ?? "none",
        currentPeriodEnd: sub?.currentPeriodEnd ?? null,
        credits: wallet?.balance ?? 0,
    };
}
//# sourceMappingURL=billingStatusService.js.map