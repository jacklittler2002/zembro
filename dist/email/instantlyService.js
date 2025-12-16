"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInstantlyWebhook = handleInstantlyWebhook;
exports.purchaseInstantlyAccounts = purchaseInstantlyAccounts;
exports.isInstantlyEnabled = isInstantlyEnabled;
const db_1 = require("../db");
const logger_1 = require("../logger");
const encryption_1 = require("./encryption");
/**
 * Webhook handler for Instantly email account provisioning
 * Called when Instantly finishes provisioning email accounts for a user
 */
async function handleInstantlyWebhook(payload) {
    logger_1.logger.info("Received Instantly webhook", {
        orderId: payload.orderId,
        customerId: payload.customerId,
        accountCount: payload.accounts.length,
    });
    const createdAccounts = [];
    for (const account of payload.accounts) {
        try {
            // Check if account already exists
            const existing = await db_1.prisma.emailAccount.findUnique({
                where: { email: account.email },
            });
            if (existing) {
                logger_1.logger.warn("Email account already exists, skipping", {
                    email: account.email,
                });
                continue;
            }
            // Create email account with encrypted credentials
            const emailAccount = await db_1.prisma.emailAccount.create({
                data: {
                    userId: payload.customerId,
                    email: account.email,
                    provider: "instantly",
                    fromName: null,
                    // SMTP config
                    smtpHost: account.smtp.host,
                    smtpPort: account.smtp.port,
                    smtpUsername: account.smtp.username,
                    smtpPassword: (0, encryption_1.encrypt)(account.smtp.password),
                    smtpSecure: account.smtp.secure,
                    // IMAP config
                    imapHost: account.imap.host,
                    imapPort: account.imap.port,
                    imapUsername: account.imap.username,
                    imapPassword: (0, encryption_1.encrypt)(account.imap.password),
                    // Status & settings
                    status: account.warmupStatus === "active" ? "WARMING_UP" : "ACTIVE",
                    dailySendLimit: 50, // Instantly's recommended limit
                    warmupEnabled: true,
                    warmupStage: account.warmupStatus === "active" ? 1 : 0,
                    warmupStartedAt: account.warmupStatus === "active" ? new Date() : null,
                    // Instantly metadata
                    instantlyAccountId: account.instantlyAccountId,
                },
            });
            createdAccounts.push(emailAccount);
            logger_1.logger.info("Created email account from Instantly", {
                email: account.email,
                status: emailAccount.status,
            });
        }
        catch (error) {
            logger_1.logger.error("Failed to create email account from Instantly", {
                email: account.email,
                error: error.message,
            });
        }
    }
    logger_1.logger.info("Instantly webhook processing complete", {
        orderId: payload.orderId,
        accountsCreated: createdAccounts.length,
    });
    return {
        success: true,
        accountsCreated: createdAccounts.length,
        accounts: createdAccounts.map((acc) => ({
            id: acc.id,
            email: acc.email,
            status: acc.status,
        })),
    };
}
/**
 * Initiate purchase of email accounts via Instantly
 * (This would call Instantly's API - placeholder for now)
 */
async function purchaseInstantlyAccounts(userId, quantity) {
    // TODO: Replace with actual Instantly API call when we have API key
    const instantlyApiKey = process.env.INSTANTLY_API_KEY;
    if (!instantlyApiKey) {
        throw new Error("Instantly integration not configured. Please contact support or connect your own email accounts.");
    }
    // Placeholder for Instantly API call
    // const response = await fetch("https://api.instantly.ai/v1/accounts/purchase", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${instantlyApiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     quantity,
    //     customerId: userId,
    //     webhookUrl: `${process.env.BASE_URL}/api/webhooks/instantly`,
    //   }),
    // });
    logger_1.logger.info("Instantly account purchase initiated", {
        userId,
        quantity,
    });
    // Return mock data for now
    return {
        orderId: `order_${Date.now()}`,
        status: "provisioning",
        estimatedTime: "15-30 minutes",
    };
}
/**
 * Check if Instantly integration is available
 */
function isInstantlyEnabled() {
    return !!process.env.INSTANTLY_API_KEY;
}
//# sourceMappingURL=instantlyService.js.map