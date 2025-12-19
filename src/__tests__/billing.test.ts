import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { prisma } from "../db";
import { isTrialEligible } from "../billing/billingService";

describe("Trial Eligibility System", () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        id: `test-user-trial-${Date.now()}`,
        email: `test-trial-${Date.now()}@example.com`,
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up
    await prisma.subscription.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: "test-trial-" } },
    });
  });

  it("should allow trial for STARTER plan when user has no prior trial or paid subscription", async () => {
    const eligible = await isTrialEligible(testUserId, "STARTER");
    expect(eligible).toBe(true);
  });

  it("should not allow trial for non-STARTER plans", async () => {
    const eligibleGrowth = await isTrialEligible(testUserId, "GROWTH");
    const eligibleScale = await isTrialEligible(testUserId, "SCALE");

    expect(eligibleGrowth).toBe(false);
    expect(eligibleScale).toBe(false);
  });

  it("should not allow trial if user has used trial before", async () => {
    // Create a subscription with hasUsedTrial = true
    await prisma.subscription.create({
      data: {
        userId: testUserId,
        stripeSubscriptionId: "test-sub-1",
        planCode: "STARTER",
        status: "canceled",
        currentPeriodEnd: new Date(),
        hasUsedTrial: true,
      },
    });

    const eligible = await isTrialEligible(testUserId, "STARTER");
    expect(eligible).toBe(false);
  });

  it("should not allow trial if user has paid subscription", async () => {
    // Create a paid subscription
    await prisma.subscription.create({
      data: {
        userId: testUserId,
        stripeSubscriptionId: "test-sub-2",
        planCode: "GROWTH",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const eligible = await isTrialEligible(testUserId, "STARTER");
    expect(eligible).toBe(false);
  });
});