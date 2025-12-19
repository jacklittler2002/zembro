"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../auth/authMiddleware");
const stripe_1 = require("./stripe");
const billingService_1 = require("./billingService");
const creditPricing_1 = require("./creditPricing");
const creditService_1 = require("../ted/creditService");
const billingStatusService_1 = require("./billingStatusService");
const router = (0, express_1.Router)();
/**
 * Get billing info for current user
 */
router.get("/api/billing", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const billingCustomer = await (0, billingService_1.getBillingCustomer)(userId);
        const subscription = await (0, billingService_1.getActiveSubscription)(userId);
        const creditBalance = await (0, creditService_1.getCreditBalance)(userId);
        // Expose trial status for frontend
        let trialStatus = null;
        if (subscription) {
            if (subscription.trialEnd && new Date(subscription.trialEnd) > new Date()) {
                trialStatus = {
                    active: true,
                    trialEnd: subscription.trialEnd,
                };
            }
            else if (subscription.hasUsedTrial) {
                trialStatus = {
                    active: false,
                    expired: true,
                    trialEnd: subscription.trialEnd,
                };
            }
            else {
                trialStatus = {
                    active: false,
                    expired: false,
                };
            }
        }
        res.json({
            billingCustomer,
            subscription,
            creditBalance,
            trialStatus,
        });
    }
    catch (error) {
        console.error("Error fetching billing info:", error);
        res.status(500).json({ error: "Failed to fetch billing info" });
    }
});
router.get("/api/billing/status", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const data = await (0, billingStatusService_1.getBillingStatus)(userId);
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching billing status:", error);
        res.status(500).json({ error: "Failed to fetch billing status" });
    }
});
/**
 * Create checkout session for subscription
 */
router.post("/api/billing/checkout/subscription", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { planCode } = req.body;
        const userId = req.userId;
        const userEmail = req.userEmail;
        if (!planCode || !creditPricing_1.SUBSCRIPTION_PLANS[planCode]) {
            return res.status(400).json({ error: "Invalid plan code" });
        }
        if (planCode === "FREE") {
            return res.status(400).json({ error: "Cannot checkout for free plan" });
        }
        // Ensure billing customer exists
        const billingCustomer = await (0, billingService_1.getOrCreateBillingCustomer)(userId, userEmail);
        const plan = creditPricing_1.SUBSCRIPTION_PLANS[planCode];
        if (!plan.priceId) {
            return res.status(500).json({ error: "Price ID not configured for this plan" });
        }
        // Check trial eligibility
        const trialEligible = await (0, billingService_1.isTrialEligible)(userId, planCode);
        const sessionConfig = {
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
        };
        // Set trial period if eligible
        if (trialEligible) {
            sessionConfig.subscription_data = {
                trial_period_days: 7,
            };
        }
        const session = await stripe_1.stripe.checkout.sessions.create(sessionConfig);
        res.json({ url: session.url });
    }
    catch (error) {
        console.error("Error creating subscription checkout:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
});
/**
 * Create checkout session for credit pack purchase
 */
router.post("/api/billing/checkout/credits", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const { packCode } = req.body;
        const userId = req.userId;
        const userEmail = req.userEmail;
        if (!packCode || !creditPricing_1.CREDIT_PACKS[packCode]) {
            return res.status(400).json({ error: "Invalid pack code" });
        }
        // Ensure billing customer exists
        const billingCustomer = await (0, billingService_1.getOrCreateBillingCustomer)(userId, userEmail);
        const pack = creditPricing_1.CREDIT_PACKS[packCode];
        if (!pack.priceId) {
            return res.status(500).json({ error: "Price ID not configured for this pack" });
        }
        const session = await stripe_1.stripe.checkout.sessions.create({
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
        res.json({ url: session.url });
    }
    catch (error) {
        console.error("Error creating credit pack checkout:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
});
/**
 * Cancel subscription
 */
router.post("/api/billing/subscription/cancel", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const subscription = await (0, billingService_1.getActiveSubscription)(userId);
        if (!subscription) {
            return res.status(404).json({ error: "No active subscription found" });
        }
        await stripe_1.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });
        res.json({ message: "Subscription will be canceled at period end" });
    }
    catch (error) {
        console.error("Error canceling subscription:", error);
        res.status(500).json({ error: "Failed to cancel subscription" });
    }
});
exports.default = router;
//# sourceMappingURL=billingRoutes.js.map