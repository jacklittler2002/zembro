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
exports.getOrCreateBillingCustomer = getOrCreateBillingCustomer;
exports.getBillingCustomer = getBillingCustomer;
exports.getActiveSubscription = getActiveSubscription;
exports.createSubscriptionCheckoutUrl = createSubscriptionCheckoutUrl;
exports.createCreditPackCheckoutUrl = createCreditPackCheckoutUrl;
exports.isTrialEligible = isTrialEligible;
const db_1 = require("../db");
const stripe_1 = require("./stripe");
const logger_1 = require("../logger");
/**
 * Get or create a Stripe customer and BillingCustomer record for a user
 */
async function getOrCreateBillingCustomer(userId, email) {
    // Check if billing customer already exists
    let billingCustomer = await db_1.prisma.billingCustomer.findUnique({
        where: { userId },
    });
    if (billingCustomer) {
        return billingCustomer;
    }
    // Create Stripe customer
    const stripeCustomer = await stripe_1.stripe.customers.create({
        email,
        metadata: {
            userId,
        },
    });
    logger_1.logger.info(`Created Stripe customer ${stripeCustomer.id} for user ${userId}`);
    // Create BillingCustomer record
    billingCustomer = await db_1.prisma.billingCustomer.create({
        data: {
            userId,
            stripeCustomerId: stripeCustomer.id,
        },
    });
    logger_1.logger.info(`Created BillingCustomer record for user ${userId}`);
    return billingCustomer;
}
/**
 * Get billing customer by user ID
 */
async function getBillingCustomer(userId) {
    return db_1.prisma.billingCustomer.findUnique({
        where: { userId },
    });
}
/**
 * Get active subscription for a user
 */
async function getActiveSubscription(userId) {
    return db_1.prisma.subscription.findFirst({
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
async function createSubscriptionCheckoutUrl(userId, planCode) {
    const { SUBSCRIPTION_PLANS } = await Promise.resolve().then(() => __importStar(require("./creditPricing.js")));
    // Get user email from Supabase
    const user = await db_1.prisma.user.findUnique({
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
    const session = await stripe_1.stripe.checkout.sessions.create({
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
    return session.url;
}
/**
 * Create a Stripe checkout URL for credit pack purchase
 */
async function createCreditPackCheckoutUrl(userId, packCode) {
    const { CREDIT_PACKS } = await Promise.resolve().then(() => __importStar(require("./creditPricing.js")));
    // Get user email from Supabase
    const user = await db_1.prisma.user.findUnique({
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
    return session.url;
}
/**
 * Check if a user is eligible for a trial on a specific plan
 */
async function isTrialEligible(userId, planCode) {
    // Only STARTER plan is trial eligible
    if (planCode !== "STARTER") {
        return false;
    }
    // Check if user has ever used a trial
    const previousTrial = await db_1.prisma.subscription.findFirst({
        where: {
            userId,
            hasUsedTrial: true,
        },
    });
    if (previousTrial) {
        return false;
    }
    // Check if user has any active or past paid subscription
    const paidSubscription = await db_1.prisma.subscription.findFirst({
        where: {
            userId,
            status: { in: ["active", "past_due", "canceled"] },
            planCode: { not: "FREE" }, // FREE is not considered paid
        },
    });
    return !paidSubscription;
}
//# sourceMappingURL=billingService.js.map