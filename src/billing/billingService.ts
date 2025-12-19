import { prisma } from "../db";
import { stripe } from "./stripe";
import { logger } from "../logger";

/**
 * Get or create a Stripe customer and BillingCustomer record for a user
 */
export async function getOrCreateBillingCustomer(userId: string, email: string) {
  // Check if billing customer already exists
  let billingCustomer = await prisma.billingCustomer.findUnique({
    where: { userId },
  });

  if (billingCustomer) {
    return billingCustomer;
  }

  // Create Stripe customer
  const stripeCustomer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  logger.info(`Created Stripe customer ${stripeCustomer.id} for user ${userId}`);

  // Create BillingCustomer record
  billingCustomer = await prisma.billingCustomer.create({
    data: {
      userId,
      stripeCustomerId: stripeCustomer.id,
    },
  });

  logger.info(`Created BillingCustomer record for user ${userId}`);

  return billingCustomer;
}

/**
 * Get billing customer by user ID
 */
export async function getBillingCustomer(userId: string) {
  return prisma.billingCustomer.findUnique({
    where: { userId },
  });
}

/**
 * Get active subscription for a user
 */
export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Create a Stripe checkout URL for subscription upgrade
 */
export async function createSubscriptionCheckoutUrl(
  userId: string,
  planCode: "STARTER" | "GROWTH" | "SCALE"
): Promise<string> {
  const { SUBSCRIPTION_PLANS } = await import("./creditPricing.js");
  
  // Get user email from Supabase
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    throw new Error("User email not found");
  }

  const billingCustomer = await getOrCreateBillingCustomer(userId, user.email);
  const plan = SUBSCRIPTION_PLANS[planCode];

  if (!plan.priceId) {
    throw new Error(`Price ID not configured for plan ${planCode}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: billingCustomer.stripeCustomerId,
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.APP_URL || "http://localhost:3000"}/app/billing?success=true`,
    cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/app/billing?canceled=true`,
    metadata: {
      userId,
      planCode,
    },
  });

  return session.url!;
}

/**
 * Create a Stripe checkout URL for credit pack purchase
 */
export async function createCreditPackCheckoutUrl(
  userId: string,
  packCode: "5K" | "20K"
): Promise<string> {
  const { CREDIT_PACKS } = await import("./creditPricing.js");
  
  // Get user email from Supabase
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    throw new Error("User email not found");
  }

  const billingCustomer = await getOrCreateBillingCustomer(userId, user.email);
  const pack = CREDIT_PACKS[packCode];

  if (!pack.priceId) {
    throw new Error(`Price ID not configured for pack ${packCode}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: billingCustomer.stripeCustomerId,
    line_items: [
      {
        price: pack.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.APP_URL || "http://localhost:3000"}/app/billing?success=true`,
    cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/app/billing?canceled=true`,
    metadata: {
      userId,
      packCode,
      credits: pack.credits.toString(),
    },
  });

  return session.url!;
}

/**
 * Check if a user is eligible for a trial on a specific plan
 */
export async function isTrialEligible(userId: string, planCode: string): Promise<boolean> {
  // Only STARTER plan is trial eligible
  if (planCode !== "STARTER") {
    return false;
  }

  // Check if user has ever used a trial
  const previousTrial = await prisma.subscription.findFirst({
    where: {
      userId,
      hasUsedTrial: true,
    },
  });

  if (previousTrial) {
    return false;
  }

  // Check if user has any active or past paid subscription
  const paidSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "past_due", "canceled"] },
      planCode: { not: "FREE" }, // FREE is not considered paid
    },
  });

  return !paidSubscription;
}
