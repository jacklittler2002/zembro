"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSmtpConnection = testSmtpConnection;
exports.addEmailAccount = addEmailAccount;
exports.getSmtpCredentials = getSmtpCredentials;
exports.getUserEmailAccounts = getUserEmailAccounts;
exports.deleteEmailAccount = deleteEmailAccount;
exports.updateEmailAccountStatus = updateEmailAccountStatus;
exports.trackEmailSent = trackEmailSent;
exports.getProviderPreset = getProviderPreset;
const nodemailer_1 = __importDefault(require("nodemailer"));
const db_1 = require("../db");
const logger_1 = require("../logger");
const encryption_1 = require("./encryption");
/**
 * Test SMTP connection to verify credentials work
 */
async function testSmtpConnection(config) {
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure ?? config.port === 465,
            auth: {
                user: config.username,
                pass: config.password,
            },
            // Increase timeout for slow SMTP servers
            connectionTimeout: 10000,
        });
        await transporter.verify();
        logger_1.logger.info("SMTP connection test successful", {
            host: config.host,
            username: config.username,
        });
        return { success: true };
    }
    catch (error) {
        logger_1.logger.error("SMTP connection test failed", {
            host: config.host,
            error: error.message,
        });
        return {
            success: false,
            error: error.message || "Failed to connect to SMTP server",
        };
    }
}
/**
 * Add a new email account for a user (BYOE - Bring Your Own Email)
 */
async function addEmailAccount(userId, config) {
    // First, test the connection
    const testResult = await testSmtpConnection({
        host: config.smtpHost,
        port: config.smtpPort,
        username: config.smtpUsername,
        password: config.smtpPassword,
        ...(config.smtpSecure !== undefined && { secure: config.smtpSecure }),
    });
    if (!testResult.success) {
        throw new Error(`SMTP connection failed: ${testResult.error}`);
    }
    // Encrypt sensitive credentials
    const encryptedSmtpPassword = (0, encryption_1.encrypt)(config.smtpPassword);
    const encryptedImapPassword = config.imapPassword
        ? (0, encryption_1.encrypt)(config.imapPassword)
        : null;
    // Create email account in database
    const emailAccount = await db_1.prisma.emailAccount.create({
        data: {
            userId,
            email: config.email,
            provider: config.provider,
            fromName: config.fromName || null,
            smtpHost: config.smtpHost,
            smtpPort: config.smtpPort,
            smtpUsername: config.smtpUsername,
            smtpPassword: encryptedSmtpPassword,
            smtpSecure: config.smtpSecure ?? config.smtpPort === 465,
            imapHost: config.imapHost || null,
            imapPort: config.imapPort || null,
            imapUsername: config.imapUsername || null,
            imapPassword: encryptedImapPassword,
            status: "ACTIVE", // Connection already verified
            dailySendLimit: config.dailySendLimit || 50,
            warmupEnabled: config.warmupEnabled ?? false,
        },
    });
    logger_1.logger.info("Email account added successfully", {
        userId,
        email: config.email,
        provider: config.provider,
    });
    return emailAccount;
}
/**
 * Get decrypted SMTP credentials for sending
 */
async function getSmtpCredentials(emailAccountId) {
    const account = await db_1.prisma.emailAccount.findUnique({
        where: { id: emailAccountId },
    });
    if (!account) {
        throw new Error("Email account not found");
    }
    if (account.status !== "ACTIVE" && account.status !== "WARMING_UP") {
        throw new Error(`Email account is ${account.status}, cannot send`);
    }
    return {
        email: account.email,
        fromName: account.fromName,
        smtpHost: account.smtpHost,
        smtpPort: account.smtpPort,
        smtpUsername: account.smtpUsername,
        smtpPassword: (0, encryption_1.decrypt)(account.smtpPassword),
        smtpSecure: account.smtpSecure,
    };
}
/**
 * Get all email accounts for a user
 */
async function getUserEmailAccounts(userId) {
    return await db_1.prisma.emailAccount.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
}
/**
 * Delete an email account
 */
async function deleteEmailAccount(userId, emailAccountId) {
    const account = await db_1.prisma.emailAccount.findFirst({
        where: {
            id: emailAccountId,
            userId, // Ensure user owns this account
        },
    });
    if (!account) {
        throw new Error("Email account not found or unauthorized");
    }
    await db_1.prisma.emailAccount.delete({
        where: { id: emailAccountId },
    });
    logger_1.logger.info("Email account deleted", {
        userId,
        emailAccountId,
        email: account.email,
    });
}
/**
 * Update email account status
 */
async function updateEmailAccountStatus(emailAccountId, status) {
    await db_1.prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: { status },
    });
    logger_1.logger.info("Email account status updated", {
        emailAccountId,
        status,
    });
}
/**
 * Increment daily sent count and check limits
 */
async function trackEmailSent(emailAccountId) {
    const account = await db_1.prisma.emailAccount.findUnique({
        where: { id: emailAccountId },
    });
    if (!account) {
        throw new Error("Email account not found");
    }
    // Check if we need to reset daily counter (new day)
    const now = new Date();
    const lastReset = account.lastResetAt;
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceReset >= 1) {
        // Reset counter for new day
        await db_1.prisma.emailAccount.update({
            where: { id: emailAccountId },
            data: {
                dailySentCount: 1,
                lastSentAt: now,
                lastResetAt: now,
                totalSent: { increment: 1 },
            },
        });
        return { withinLimit: true, remaining: account.dailySendLimit - 1 };
    }
    // Check if we're at the limit
    if (account.dailySentCount >= account.dailySendLimit) {
        return {
            withinLimit: false,
            remaining: 0,
            error: `Daily send limit reached (${account.dailySendLimit})`,
        };
    }
    // Increment counter
    await db_1.prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: {
            dailySentCount: { increment: 1 },
            lastSentAt: now,
            totalSent: { increment: 1 },
        },
    });
    return {
        withinLimit: true,
        remaining: account.dailySendLimit - (account.dailySentCount + 1),
    };
}
/**
 * Get provider presets for common email services
 */
function getProviderPreset(provider) {
    const presets = {
        gmail: {
            smtpHost: "smtp.gmail.com",
            smtpPort: 587,
            imapHost: "imap.gmail.com",
            imapPort: 993,
        },
        outlook: {
            smtpHost: "smtp-mail.outlook.com",
            smtpPort: 587,
            imapHost: "outlook.office365.com",
            imapPort: 993,
        },
    };
    return presets[provider];
}
//# sourceMappingURL=emailAccountService.js.map