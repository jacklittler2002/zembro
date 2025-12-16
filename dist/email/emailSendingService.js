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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEmailQueue = processEmailQueue;
exports.sendCampaignEmail = sendCampaignEmail;
exports.trackEmailOpen = trackEmailOpen;
exports.trackEmailReply = trackEmailReply;
exports.trackEmailBounce = trackEmailBounce;
exports.trackEmailUnsubscribe = trackEmailUnsubscribe;
exports.getCampaignStats = getCampaignStats;
const nodemailer_1 = __importDefault(require("nodemailer"));
const db_1 = require("../db");
const logger_1 = require("../logger");
const emailAccountService_1 = require("./emailAccountService");
/**
 * Process the email queue and send pending emails
 * This should run periodically (e.g., every 5 minutes via worker)
 */
async function processEmailQueue() {
    logger_1.logger.info("Processing email queue");
    // Get all campaigns that should be sending
    const activeCampaigns = await db_1.prisma.campaign.findMany({
        where: {
            status: { in: ["RUNNING", "SCHEDULED"] },
        },
        include: {
            emailAccounts: {
                include: {
                    emailAccount: true,
                },
            },
        },
    });
    for (const campaign of activeCampaigns) {
        try {
            await processCampaignQueue(campaign.id);
        }
        catch (error) {
            logger_1.logger.error("Error processing campaign queue", {
                campaignId: campaign.id,
                error,
            });
        }
    }
}
/**
 * Process queue for a specific campaign
 */
async function processCampaignQueue(campaignId) {
    const campaign = await db_1.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            emailAccounts: {
                include: {
                    emailAccount: true,
                },
            },
        },
    });
    if (!campaign)
        return;
    const now = new Date();
    // Check if within send time window
    if (campaign.sendTimeStart && campaign.sendTimeEnd) {
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`;
        if (currentTime < campaign.sendTimeStart ||
            currentTime > campaign.sendTimeEnd) {
            logger_1.logger.info("Outside send time window", {
                campaignId,
                currentTime,
                window: `${campaign.sendTimeStart}-${campaign.sendTimeEnd}`,
            });
            return;
        }
    }
    // Check if campaign has reached daily limit
    if (campaign.dailyLimit && campaign.emailsSentToday >= campaign.dailyLimit) {
        logger_1.logger.info("Campaign reached daily limit", {
            campaignId,
            sentToday: campaign.emailsSentToday,
            limit: campaign.dailyLimit,
        });
        return;
    }
    // Get pending emails scheduled for now or earlier
    const pendingEmails = await db_1.prisma.campaignEmail.findMany({
        where: {
            campaignId,
            status: "QUEUED",
            scheduledFor: {
                lte: now,
            },
        },
        include: {
            emailAccount: true,
        },
        take: 100, // Process in batches
        orderBy: { scheduledFor: "asc" },
    });
    logger_1.logger.info("Found pending emails", {
        campaignId,
        count: pendingEmails.length,
    });
    for (const email of pendingEmails) {
        try {
            await sendCampaignEmail(email.id);
        }
        catch (error) {
            logger_1.logger.error("Error sending campaign email", {
                emailId: email.id,
                error,
            });
            // Mark as failed
            await db_1.prisma.campaignEmail.update({
                where: { id: email.id },
                data: {
                    status: "FAILED",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
            });
        }
    }
}
/**
 * Send a single campaign email
 */
async function sendCampaignEmail(campaignEmailId) {
    const campaignEmail = await db_1.prisma.campaignEmail.findUnique({
        where: { id: campaignEmailId },
        include: {
            emailAccount: true,
            campaign: true,
        },
    });
    if (!campaignEmail) {
        throw new Error("Campaign email not found");
    }
    if (campaignEmail.status !== "QUEUED") {
        logger_1.logger.warn("Campaign email is not queued", {
            emailId: campaignEmailId,
            status: campaignEmail.status,
        });
        return;
    }
    // Check email account health
    if (campaignEmail.emailAccount.status !== "ACTIVE") {
        logger_1.logger.warn("Email account is not active", {
            accountId: campaignEmail.emailAccount.id,
            status: campaignEmail.emailAccount.status,
        });
        throw new Error("Email account is not active");
    }
    // Update status to SENDING
    await db_1.prisma.campaignEmail.update({
        where: { id: campaignEmailId },
        data: { status: "SENDING" },
    });
    try {
        // Get SMTP credentials
        const credentials = await (0, emailAccountService_1.getSmtpCredentials)(campaignEmail.emailAccount.id);
        // Create transporter
        const transporter = nodemailer_1.default.createTransport({
            host: credentials.smtpHost,
            port: credentials.smtpPort,
            secure: credentials.smtpPort === 465,
            auth: {
                user: credentials.smtpUsername,
                pass: credentials.smtpPassword,
            },
        });
        // Send email
        const info = await transporter.sendMail({
            from: `${campaignEmail.emailAccount.fromName || campaignEmail.emailAccount.email} <${campaignEmail.emailAccount.email}>`,
            to: campaignEmail.recipientEmail,
            subject: campaignEmail.subject,
            text: campaignEmail.body,
            html: campaignEmail.body.replace(/\n/g, "<br>"),
            headers: {
                "X-Campaign-ID": campaignEmail.campaignId,
                "X-Email-ID": campaignEmail.id,
            },
        });
        logger_1.logger.info("Email sent successfully", {
            emailId: campaignEmailId,
            recipientEmail: campaignEmail.recipientEmail,
            messageId: info.messageId,
        });
        // Update email status
        await db_1.prisma.campaignEmail.update({
            where: { id: campaignEmailId },
            data: {
                status: "SENT",
                sentAt: new Date(),
                messageId: info.messageId,
            },
        });
        // Track email sent in account
        const { trackEmailSent } = await Promise.resolve().then(() => __importStar(require("./emailAccountService")));
        await trackEmailSent(campaignEmail.emailAccount.id);
        // Update campaign stats
        await db_1.prisma.campaign.update({
            where: { id: campaignEmail.campaignId },
            data: {
                emailsSent: { increment: 1 },
                emailsSentToday: { increment: 1 },
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Error sending email via SMTP", {
            emailId: campaignEmailId,
            error,
        });
        // Update email status
        await db_1.prisma.campaignEmail.update({
            where: { id: campaignEmailId },
            data: {
                status: "FAILED",
                error: error instanceof Error ? error.message : "Unknown error",
            },
        });
        // Update campaign stats
        await db_1.prisma.campaign.update({
            where: { id: campaignEmail.campaignId },
            data: {
                emailsFailed: { increment: 1 },
            },
        });
        throw error;
    }
}
/**
 * Track email open (called when tracking pixel is loaded)
 */
async function trackEmailOpen(campaignEmailId) {
    const campaignEmail = await db_1.prisma.campaignEmail.findUnique({
        where: { id: campaignEmailId },
    });
    if (!campaignEmail)
        return;
    // Only track first open
    if (campaignEmail.status === "SENT") {
        await db_1.prisma.campaignEmail.update({
            where: { id: campaignEmailId },
            data: {
                status: "OPENED",
                openedAt: new Date(),
            },
        });
        // Update campaign stats
        await db_1.prisma.campaign.update({
            where: { id: campaignEmail.campaignId },
            data: {
                emailsOpened: { increment: 1 },
            },
        });
        // Update email account health
        await db_1.prisma.emailAccount.update({
            where: { id: campaignEmail.emailAccountId },
            data: {
                openRate: {
                    increment: 1,
                },
            },
        });
        logger_1.logger.info("Email opened", {
            emailId: campaignEmailId,
            recipientEmail: campaignEmail.recipientEmail,
        });
    }
}
/**
 * Track email reply
 */
async function trackEmailReply(campaignEmailId) {
    const campaignEmail = await db_1.prisma.campaignEmail.findUnique({
        where: { id: campaignEmailId },
    });
    if (!campaignEmail)
        return;
    await db_1.prisma.campaignEmail.update({
        where: { id: campaignEmailId },
        data: {
            status: "REPLIED",
            repliedAt: new Date(),
        },
    });
    // Update campaign stats
    await db_1.prisma.campaign.update({
        where: { id: campaignEmail.campaignId },
        data: {
            emailsReplied: { increment: 1 },
        },
    });
    // Update email account health
    await db_1.prisma.emailAccount.update({
        where: { id: campaignEmail.emailAccountId },
        data: {
            replyRate: {
                increment: 1,
            },
        },
    });
    logger_1.logger.info("Email replied", {
        emailId: campaignEmailId,
        recipientEmail: campaignEmail.recipientEmail,
    });
}
/**
 * Track email bounce
 */
async function trackEmailBounce(campaignEmailId, bounceType) {
    const campaignEmail = await db_1.prisma.campaignEmail.findUnique({
        where: { id: campaignEmailId },
    });
    if (!campaignEmail)
        return;
    await db_1.prisma.campaignEmail.update({
        where: { id: campaignEmailId },
        data: {
            status: "BOUNCED",
            bouncedAt: new Date(),
            bounceType,
        },
    });
    // Update campaign stats
    await db_1.prisma.campaign.update({
        where: { id: campaignEmail.campaignId },
        data: {
            emailsBounced: { increment: 1 },
        },
    });
    // Update email account health
    await db_1.prisma.emailAccount.update({
        where: { id: campaignEmail.emailAccountId },
        data: {
            bounceRate: {
                increment: 1,
            },
        },
    });
    logger_1.logger.warn("Email bounced", {
        emailId: campaignEmailId,
        recipientEmail: campaignEmail.recipientEmail,
        bounceType,
    });
}
/**
 * Track email unsubscribe
 */
async function trackEmailUnsubscribe(campaignEmailId) {
    const campaignEmail = await db_1.prisma.campaignEmail.findUnique({
        where: { id: campaignEmailId },
    });
    if (!campaignEmail)
        return;
    await db_1.prisma.campaignEmail.update({
        where: { id: campaignEmailId },
        data: {
            status: "UNSUBSCRIBED",
            unsubscribedAt: new Date(),
        },
    });
    // Update campaign stats
    await db_1.prisma.campaign.update({
        where: { id: campaignEmail.campaignId },
        data: {
            emailsUnsubscribed: { increment: 1 },
        },
    });
    logger_1.logger.info("Email unsubscribed", {
        emailId: campaignEmailId,
        recipientEmail: campaignEmail.recipientEmail,
    });
}
/**
 * Get campaign statistics
 */
async function getCampaignStats(campaignId) {
    const campaign = await db_1.prisma.campaign.findUnique({
        where: { id: campaignId },
    });
    if (!campaign) {
        throw new Error("Campaign not found");
    }
    const emailStats = await db_1.prisma.campaignEmail.groupBy({
        by: ["status"],
        where: { campaignId },
        _count: true,
    });
    const stats = {};
    emailStats.forEach((stat) => {
        stats[stat.status] = stat._count;
    });
    return {
        totalLeads: campaign.totalLeads,
        emailsQueued: campaign.emailsQueued,
        emailsSent: campaign.emailsSent,
        emailsOpened: campaign.emailsOpened,
        emailsReplied: campaign.emailsReplied,
        emailsBounced: campaign.emailsBounced,
        emailsFailed: campaign.emailsFailed,
        emailsUnsubscribed: campaign.emailsUnsubscribed,
        openRate: campaign.emailsSent > 0
            ? (campaign.emailsOpened / campaign.emailsSent) * 100
            : 0,
        replyRate: campaign.emailsSent > 0
            ? (campaign.emailsReplied / campaign.emailsSent) * 100
            : 0,
        bounceRate: campaign.emailsSent > 0
            ? (campaign.emailsBounced / campaign.emailsSent) * 100
            : 0,
        statusBreakdown: stats,
    };
}
//# sourceMappingURL=emailSendingService.js.map