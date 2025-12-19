"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditError = void 0;
exports.getOrCreateWalletForUser = getOrCreateWalletForUser;
exports.getCreditBalance = getCreditBalance;
exports.addCredits = addCredits;
exports.consumeCredits = consumeCredits;
const db_1 = require("../db");
const logger_1 = require("../logger");
/**
 * Custom error for credit-related issues
 */
class CreditError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = "CreditError";
    }
}
exports.CreditError = CreditError;
/**
 * Get or create an AI credit wallet for a user.
 * New users start with 100 free credits.
 * Free users get a monthly refresh of 100 credits (capped at 100 total).
 */
async function getOrCreateWalletForUser(userId) {
    let wallet = await db_1.prisma.aiCreditWallet.findUnique({
        where: { userId },
    });
    if (!wallet) {
        // New users start with 100 credits
        wallet = await db_1.prisma.aiCreditWallet.create({
            data: {
                userId,
                balance: 100,
                lastTopupAt: new Date(),
            },
        });
        // Record the initial credit grant
        await db_1.prisma.aiCreditTransaction.create({
            data: {
                walletId: wallet.id,
                change: 100,
                reason: "INITIAL_GRANT",
                metadata: { type: "new_user_bonus" },
            },
        });
        logger_1.logger.info(`Created new AI credit wallet for user: ${userId} with 100 starting credits`);
    }
    else {
        // Check if free user needs monthly refresh
        await maybeRefreshFreeUserCredits(wallet);
    }
    return wallet;
}
/**
 * Refresh credits for free users (monthly cap at 100 total).
 * Free users get +100 credits per month, but capped at 100 max balance.
 */
async function maybeRefreshFreeUserCredits(wallet) {
    const now = new Date();
    const lastTopup = wallet.lastTopupAt || wallet.createdAt;
    const daysSinceTopup = (now.getTime() - lastTopup.getTime()) / (1000 * 60 * 60 * 24);
    // Check if it's been at least 30 days since last topup
    if (daysSinceTopup >= 30) {
        // Check if user is on a paid plan
        const user = await db_1.prisma.user.findUnique({
            where: { id: wallet.userId },
            include: {
                subscriptions: {
                    where: { status: "active" },
                    take: 1,
                },
            },
        });
        const hasPaidPlan = user?.subscriptions && user.subscriptions.length > 0;
        // Only cap free users at 100 credits
        if (!hasPaidPlan && wallet.balance < 100) {
            const topupAmount = Math.min(100, 100 - wallet.balance);
            if (topupAmount > 0) {
                await db_1.prisma.$transaction([
                    db_1.prisma.aiCreditWallet.update({
                        where: { id: wallet.id },
                        data: {
                            balance: { increment: topupAmount },
                            lastTopupAt: now,
                        },
                    }),
                    db_1.prisma.aiCreditTransaction.create({
                        data: {
                            walletId: wallet.id,
                            change: topupAmount,
                            reason: "MONTHLY_REFRESH",
                            metadata: {
                                type: "free_tier_topup",
                                cappedAt: 100,
                            },
                        },
                    }),
                ]);
                logger_1.logger.info(`Monthly refresh: Added ${topupAmount} credits to free user ${wallet.userId} (capped at 100)`);
            }
        }
    }
}
/**
 * Get the current credit balance for a user.
 */
async function getCreditBalance(userId) {
    const wallet = await getOrCreateWalletForUser(userId);
    return wallet.balance;
}
/**
 * Add credits to a user's wallet.
 * Creates a transaction record with the reason and optional metadata.
 */
async function addCredits(userId, amount, reason, metadata) {
    if (amount <= 0) {
        throw new Error("Credit amount must be positive");
    }
    const wallet = await getOrCreateWalletForUser(userId);
    await db_1.prisma.$transaction([
        db_1.prisma.aiCreditWallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: amount } },
        }),
        db_1.prisma.aiCreditTransaction.create({
            data: {
                walletId: wallet.id,
                change: amount,
                reason,
                metadata: metadata || {},
            },
        }),
    ]);
    logger_1.logger.info(`Added ${amount} credits to user ${userId}. Reason: ${reason}`);
}
/**
 * Consume credits from a user's wallet.
 * Throws an error if insufficient credits.
 * Creates a transaction record with the reason and optional metadata.
 */
async function consumeCredits(userId, amount, reason, metadata) {
    if (amount <= 0) {
        throw new Error("Credit amount must be positive");
    }
    const wallet = await getOrCreateWalletForUser(userId);
    if (wallet.balance < amount) {
        throw new CreditError("INSUFFICIENT_CREDITS", `Insufficient credits. Required: ${amount}, Available: ${wallet.balance}`, {
            required: amount,
            available: wallet.balance,
        });
    }
    await db_1.prisma.$transaction([
        db_1.prisma.aiCreditWallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: amount } },
        }),
        db_1.prisma.aiCreditTransaction.create({
            data: {
                walletId: wallet.id,
                change: -amount,
                reason,
                metadata: metadata || {},
            },
        }),
    ]);
    logger_1.logger.info(`Consumed ${amount} credits from user ${userId}. Reason: ${reason}`);
}
//# sourceMappingURL=creditService.js.map