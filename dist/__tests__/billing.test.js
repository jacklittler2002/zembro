"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const db_1 = require("../db");
const billingService_1 = require("../billing/billingService");
(0, globals_1.describe)("Trial Eligibility System", () => {
    let testUserId;
    (0, globals_1.beforeEach)(async () => {
        // Create test user
        const user = await db_1.prisma.user.create({
            data: {
                id: `test-user-trial-${Date.now()}`,
                email: `test-trial-${Date.now()}@example.com`,
            },
        });
        testUserId = user.id;
    });
    (0, globals_1.afterEach)(async () => {
        // Clean up
        await db_1.prisma.subscription.deleteMany({
            where: { userId: testUserId },
        });
        await db_1.prisma.user.deleteMany({
            where: { email: { startsWith: "test-trial-" } },
        });
    });
    (0, globals_1.it)("should allow trial for STARTER plan when user has no prior trial or paid subscription", async () => {
        const eligible = await (0, billingService_1.isTrialEligible)(testUserId, "STARTER");
        (0, globals_1.expect)(eligible).toBe(true);
    });
    (0, globals_1.it)("should not allow trial for non-STARTER plans", async () => {
        const eligibleGrowth = await (0, billingService_1.isTrialEligible)(testUserId, "GROWTH");
        const eligibleScale = await (0, billingService_1.isTrialEligible)(testUserId, "SCALE");
        (0, globals_1.expect)(eligibleGrowth).toBe(false);
        (0, globals_1.expect)(eligibleScale).toBe(false);
    });
    (0, globals_1.it)("should not allow trial if user has used trial before", async () => {
        // Create a subscription with hasUsedTrial = true
        await db_1.prisma.subscription.create({
            data: {
                userId: testUserId,
                stripeSubscriptionId: "test-sub-1",
                planCode: "STARTER",
                status: "canceled",
                currentPeriodEnd: new Date(),
                hasUsedTrial: true,
            },
        });
        const eligible = await (0, billingService_1.isTrialEligible)(testUserId, "STARTER");
        (0, globals_1.expect)(eligible).toBe(false);
    });
    (0, globals_1.it)("should not allow trial if user has paid subscription", async () => {
        // Create a paid subscription
        await db_1.prisma.subscription.create({
            data: {
                userId: testUserId,
                stripeSubscriptionId: "test-sub-2",
                planCode: "GROWTH",
                status: "active",
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        const eligible = await (0, billingService_1.isTrialEligible)(testUserId, "STARTER");
        (0, globals_1.expect)(eligible).toBe(false);
    });
});
//# sourceMappingURL=billing.test.js.map