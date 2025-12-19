import { Router, raw } from "express";
import { stripe } from "./stripe";
import { prisma } from "../db";
import { addCredits } from "../ted/creditService";
import { PLAN_MONTHLY_CREDITS } from "./creditPricing";
import { logger } from "../logger";

const router = Router();

/**
 * Stripe webhook endpoint
 *
 * NOTE: This route uses express.raw() to ensure Stripe can verify the signature.
 * It must be registered BEFORE express.json() is applied globally.
 * Do not move this below bodyParser.json() or app-wide express.json().
 */
router.post(
  "/webhooks/stripe",
  raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).send("Missing stripe-signature header");
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object);
          break;

        case "invoice.payment_succeeded":
          await handleInvoicePaid(event.data.object);
          break;

        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object);
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      logger.error(`Error handling webhook event: ${err.message}`);
      res.status(500).send(`Webhook handler error: ${err.message}`);
    }
  }
);

/**
 * Handle completed checkout session
 */
async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata?.userId;
  
  if (!userId) {
    logger.error("No userId in checkout session metadata");
    return;
  }

  // Check if this is a subscription or one-time payment
  if (session.mode === "subscription") {
    // Subscription checkout - will be handled by invoice.payment_succeeded
    logger.info(`Subscription checkout completed for user ${userId}`);
  } else if (session.mode === "payment") {
    // One-time credit pack purchase
    const packCode = session.metadata?.packCode;
    const credits = parseInt(session.metadata?.credits || "0");

    if (!packCode || !credits) {
      logger.error("Missing packCode or credits in session metadata");
      return;
    }

    await addCredits(
      userId,
      credits,
      "CREDIT_PACK_PURCHASE",
      {
        packCode,
        sessionId: session.id,
      }
    );

    logger.info(`Added ${credits} credits to user ${userId} from pack ${packCode}`);
  }
}

/**
 * Handle successful invoice payment (subscription renewals)
 */
async function handleInvoicePaid(invoice: any) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    // Not a subscription invoice
    return;
  }

  // Find subscription in our database
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    logger.warn(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // Get monthly credits for this plan
  const monthlyCredits = PLAN_MONTHLY_CREDITS[subscription.planCode as keyof typeof PLAN_MONTHLY_CREDITS];

  if (!monthlyCredits) {
    logger.warn(`No monthly credits defined for plan: ${subscription.planCode}`);
    return;
  }

  // Add monthly credits
  await addCredits(
    subscription.userId,
    monthlyCredits,
    "PLAN_MONTHLY_GRANT",
    {
      planCode: subscription.planCode,
      subscriptionId,
      invoiceId: invoice.id,
    }
  );

  logger.info(
    `Added ${monthlyCredits} monthly credits to user ${subscription.userId} for ${subscription.planCode} plan`
  );
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(stripeSubscription: any) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    // New subscription - create it
    const customerId = stripeSubscription.customer;
    const billingCustomer = await prisma.billingCustomer.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!billingCustomer) {
      logger.error(`No billing customer found for Stripe customer ${customerId}`);
      return;
    }

    // Determine plan code from metadata or price
    const planCode = stripeSubscription.metadata?.planCode || "STARTER";

    // Check if this plan is trial eligible and user hasn't used trial
    const { SUBSCRIPTION_PLANS } = await import("./creditPricing.js");
    const plan = SUBSCRIPTION_PLANS[planCode as keyof typeof SUBSCRIPTION_PLANS];
    const isTrialEligible = plan?.trialEligible;

    const previousTrial = await prisma.subscription.findFirst({
      where: {
        userId: billingCustomer.userId,
        hasUsedTrial: true,
      },
    });

    let trialStart = null;
    let trialEnd = null;
    let hasUsedTrial = false;
    if (isTrialEligible && !previousTrial) {
      // Grant a one-week trial only for eligible plans
      trialStart = new Date();
      trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      hasUsedTrial = true;
    }

    await prisma.subscription.create({
      data: {
        userId: billingCustomer.userId,
        stripeSubscriptionId: stripeSubscription.id,
        planCode,
        status: stripeSubscription.status,
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart,
        trialEnd,
        hasUsedTrial,
      },
    });

    logger.info(`Created subscription record for user ${billingCustomer.userId} (trial: ${!previousTrial})`);
  } else {
    // Update existing subscription
    const updateData: any = {
      status: stripeSubscription.status,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    };

    // Update trial info if present
    if (stripeSubscription.trial_end) {
      updateData.trialEnd = new Date(stripeSubscription.trial_end * 1000);
    }
    if (stripeSubscription.trial_start) {
      updateData.trialStart = new Date(stripeSubscription.trial_start * 1000);
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: updateData,
    });

    logger.info(`Updated subscription for user ${subscription.userId}`);
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(stripeSubscription: any) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "canceled" },
    });

    logger.info(`Subscription canceled for user ${subscription.userId}`);
  }
}

export default router;
