"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_js_1 = require("./stripe.js");
const db_js_1 = require("../db.js");
const creditService_js_1 = require("../ted/creditService.js");
const creditPricing_js_1 = require("./creditPricing.js");
const logger_js_1 = require("../logger.js");
const router = (0, express_1.Router)();
/**
 * Stripe webhook endpoint
 * This must be registered BEFORE express.json() middleware
 */
router.post("/webhooks/stripe", (0, express_1.raw)({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        return res.status(400).send("Missing stripe-signature header");
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        logger_js_1.logger.error("STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).send("Webhook secret not configured");
    }
    let event;
    try {
        event = stripe_js_1.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        logger_js_1.logger.error(`Webhook signature verification failed: ${err.message}`);
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
                logger_js_1.logger.info(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (err) {
        logger_js_1.logger.error(`Error handling webhook event: ${err.message}`);
        res.status(500).send(`Webhook handler error: ${err.message}`);
    }
});
/**
 * Handle completed checkout session
 */
async function handleCheckoutCompleted(session) {
    const userId = session.metadata?.userId;
    if (!userId) {
        logger_js_1.logger.error("No userId in checkout session metadata");
        return;
    }
    // Check if this is a subscription or one-time payment
    if (session.mode === "subscription") {
        // Subscription checkout - will be handled by invoice.payment_succeeded
        logger_js_1.logger.info(`Subscription checkout completed for user ${userId}`);
    }
    else if (session.mode === "payment") {
        // One-time credit pack purchase
        const packCode = session.metadata?.packCode;
        const credits = parseInt(session.metadata?.credits || "0");
        if (!packCode || !credits) {
            logger_js_1.logger.error("Missing packCode or credits in session metadata");
            return;
        }
        await (0, creditService_js_1.addCredits)(userId, credits, "CREDIT_PACK_PURCHASE", {
            packCode,
            sessionId: session.id,
        });
        logger_js_1.logger.info(`Added ${credits} credits to user ${userId} from pack ${packCode}`);
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
    const subscription = await db_js_1.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
    });
    if (!subscription) {
        logger_js_1.logger.warn(`Subscription not found: ${subscriptionId}`);
        return;
    }
    // Get monthly credits for this plan
    const monthlyCredits = creditPricing_js_1.PLAN_MONTHLY_CREDITS[subscription.planCode];
    if (!monthlyCredits) {
        logger_js_1.logger.warn(`No monthly credits defined for plan: ${subscription.planCode}`);
        return;
    }
    // Add monthly credits
    await (0, creditService_js_1.addCredits)(subscription.userId, monthlyCredits, "PLAN_MONTHLY_GRANT", {
        planCode: subscription.planCode,
        subscriptionId,
        invoiceId: invoice.id,
    });
    logger_js_1.logger.info(`Added ${monthlyCredits} monthly credits to user ${subscription.userId} for ${subscription.planCode} plan`);
}
/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(stripeSubscription) {
    const subscription = await db_js_1.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!subscription) {
        // New subscription - create it
        const customerId = stripeSubscription.customer;
        const billingCustomer = await db_js_1.prisma.billingCustomer.findFirst({
            where: { stripeCustomerId: customerId },
        });
        if (!billingCustomer) {
            logger_js_1.logger.error(`No billing customer found for Stripe customer ${customerId}`);
            return;
        }
        // Determine plan code from metadata or price
        const planCode = stripeSubscription.metadata?.planCode || "STARTER";
        await db_js_1.prisma.subscription.create({
            data: {
                userId: billingCustomer.userId,
                stripeSubscriptionId: stripeSubscription.id,
                planCode,
                status: stripeSubscription.status,
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            },
        });
        logger_js_1.logger.info(`Created subscription record for user ${billingCustomer.userId}`);
    }
    else {
        // Update existing subscription
        await db_js_1.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: stripeSubscription.status,
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            },
        });
        logger_js_1.logger.info(`Updated subscription for user ${subscription.userId}`);
    }
}
/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(stripeSubscription) {
    const subscription = await db_js_1.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (subscription) {
        await db_js_1.prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "canceled" },
        });
        logger_js_1.logger.info(`Subscription canceled for user ${subscription.userId}`);
    }
}
exports.default = router;
//# sourceMappingURL=webhookRoutes.js.map