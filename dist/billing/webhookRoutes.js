"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = require("./stripe");
const db_1 = require("../db");
const creditService_1 = require("../ted/creditService");
const creditPricing_1 = require("./creditPricing");
const logger_1 = require("../logger");
const router = (0, express_1.Router)();
/**
 * Stripe webhook endpoint
 *
 * NOTE: This route uses express.raw() to ensure Stripe can verify the signature.
 * It must be registered BEFORE express.json() is applied globally.
 * Do not move this below bodyParser.json() or app-wide express.json().
 */
router.post("/webhooks/stripe", (0, express_1.raw)({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        return res.status(400).send("Missing stripe-signature header");
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        logger_1.logger.error("STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).send("Webhook secret not configured");
    }
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        logger_1.logger.error(`Webhook signature verification failed: ${err.message}`);
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
                logger_1.logger.info(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (err) {
        logger_1.logger.error(`Error handling webhook event: ${err.message}`);
        res.status(500).send(`Webhook handler error: ${err.message}`);
    }
});
/**
 * Handle completed checkout session
 */
async function handleCheckoutCompleted(session) {
    const userId = session.metadata?.userId;
    if (!userId) {
        logger_1.logger.error("No userId in checkout session metadata");
        return;
    }
    // Check if this is a subscription or one-time payment
    if (session.mode === "subscription") {
        // Subscription checkout - will be handled by invoice.payment_succeeded
        logger_1.logger.info(`Subscription checkout completed for user ${userId}`);
    }
    else if (session.mode === "payment") {
        // One-time credit pack purchase
        const packCode = session.metadata?.packCode;
        const credits = parseInt(session.metadata?.credits || "0");
        if (!packCode || !credits) {
            logger_1.logger.error("Missing packCode or credits in session metadata");
            return;
        }
        await (0, creditService_1.addCredits)(userId, credits, "CREDIT_PACK_PURCHASE", {
            packCode,
            sessionId: session.id,
        });
        logger_1.logger.info(`Added ${credits} credits to user ${userId} from pack ${packCode}`);
    }
}
/**
 * Handle successful invoice payment (subscription renewals)
 */
async function handleInvoicePaid(invoice) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
        // Not a subscription invoice
        return;
    }
    // Find subscription in our database
    const subscription = await db_1.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
    });
    if (!subscription) {
        logger_1.logger.warn(`Subscription not found: ${subscriptionId}`);
        return;
    }
    // Get monthly credits for this plan
    const monthlyCredits = creditPricing_1.PLAN_MONTHLY_CREDITS[subscription.planCode];
    if (!monthlyCredits) {
        logger_1.logger.warn(`No monthly credits defined for plan: ${subscription.planCode}`);
        return;
    }
    // Add monthly credits
    await (0, creditService_1.addCredits)(subscription.userId, monthlyCredits, "PLAN_MONTHLY_GRANT", {
        planCode: subscription.planCode,
        subscriptionId,
        invoiceId: invoice.id,
    });
    logger_1.logger.info(`Added ${monthlyCredits} monthly credits to user ${subscription.userId} for ${subscription.planCode} plan`);
}
/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(stripeSubscription) {
    const subscription = await db_1.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!subscription) {
        // New subscription - create it
        const customerId = stripeSubscription.customer;
        const billingCustomer = await db_1.prisma.billingCustomer.findFirst({
            where: { stripeCustomerId: customerId },
        });
        if (!billingCustomer) {
            logger_1.logger.error(`No billing customer found for Stripe customer ${customerId}`);
            return;
        }
        // Determine plan code from metadata or price
        const planCode = stripeSubscription.metadata?.planCode || "STARTER";
        // Check if this plan is trial eligible and user hasn't used trial
        const { SUBSCRIPTION_PLANS } = await Promise.resolve().then(() => __importStar(require("./creditPricing.js")));
        const plan = SUBSCRIPTION_PLANS[planCode];
        const isTrialEligible = plan?.trialEligible;
        const previousTrial = await db_1.prisma.subscription.findFirst({
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
        await db_1.prisma.subscription.create({
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
        logger_1.logger.info(`Created subscription record for user ${billingCustomer.userId} (trial: ${!previousTrial})`);
    }
    else {
        // Update existing subscription
        const updateData = {
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
        await db_1.prisma.subscription.update({
            where: { id: subscription.id },
            data: updateData,
        });
        logger_1.logger.info(`Updated subscription for user ${subscription.userId}`);
    }
}
/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(stripeSubscription) {
    const subscription = await db_1.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (subscription) {
        await db_1.prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "canceled" },
        });
        logger_1.logger.info(`Subscription canceled for user ${subscription.userId}`);
    }
}
exports.default = router;
//# sourceMappingURL=webhookRoutes.js.map