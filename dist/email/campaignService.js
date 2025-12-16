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
exports.createCampaign = createCampaign;
exports.getCampaignById = getCampaignById;
exports.listUserCampaigns = listUserCampaigns;
exports.updateCampaignStatus = updateCampaignStatus;
exports.deleteCampaign = deleteCampaign;
exports.importLeadsFromSearch = importLeadsFromSearch;
const db_1 = require("../db");
const logger_1 = require("../logger");
/**
 * Create a new email campaign
 */
async function createCampaign(input) {
    logger_1.logger.info("Creating campaign", {
        userId: input.userId,
        name: input.name,
        emailAccountCount: input.emailAccountIds.length,
        stepCount: input.steps.length,
    });
    // Verify all email accounts belong to user
    const emailAccounts = await db_1.prisma.emailAccount.findMany({
        where: {
            id: { in: input.emailAccountIds },
            userId: input.userId,
        },
    });
    if (emailAccounts.length !== input.emailAccountIds.length) {
        throw new Error("One or more email accounts not found or unauthorized");
    }
    // Verify lead search if provided
    if (input.leadSearchId) {
        const leadSearch = await db_1.prisma.leadSearch.findFirst({
            where: {
                id: input.leadSearchId,
                userId: input.userId,
            },
        });
        if (!leadSearch) {
            throw new Error("Lead search not found or unauthorized");
        }
    }
    // Verify list if provided
    if (input.listId) {
        const list = await db_1.prisma.list.findFirst({
            where: {
                id: input.listId,
                userId: input.userId,
            },
        });
        if (!list) {
            throw new Error("List not found or unauthorized");
        }
    }
    // Create campaign with steps
    const campaign = await db_1.prisma.campaign.create({
        data: {
            userId: input.userId,
            name: input.name,
            status: "DRAFT",
            leadSearchId: input.leadSearchId || null,
            listId: input.listId || null,
            scheduleStartAt: input.scheduleStartAt || null,
            scheduleEndAt: input.scheduleEndAt || null,
            sendTimeStart: input.sendTimeStart || "09:00",
            sendTimeEnd: input.sendTimeEnd || "17:00",
            timezone: input.timezone || "UTC",
            dailyLimit: input.dailyLimit || 100,
            steps: {
                create: input.steps.map((step) => ({
                    stepNumber: step.stepNumber,
                    delayDays: step.delayDays,
                    subjectLine: step.subjectLine,
                    bodyTemplate: step.bodyTemplate,
                    variantSubject: step.variantSubject || null,
                    variantBody: step.variantBody || null,
                    variantPercent: step.variantPercent || 0,
                })),
            },
            emailAccounts: {
                create: input.emailAccountIds.map((accountId) => ({
                    emailAccountId: accountId,
                })),
            },
        },
        include: {
            steps: true,
            emailAccounts: {
                include: {
                    emailAccount: true,
                },
            },
        },
    });
    logger_1.logger.info("Campaign created successfully", {
        campaignId: campaign.id,
        name: campaign.name,
    });
    return campaign;
}
/**
 * Get campaign by ID with full details
 */
async function getCampaignById(campaignId, userId) {
    const campaign = await db_1.prisma.campaign.findFirst({
        where: {
            id: campaignId,
            userId,
        },
        include: {
            steps: {
                orderBy: { stepNumber: "asc" },
            },
            emailAccounts: {
                include: {
                    emailAccount: true,
                },
            },
            leadSearch: true,
        },
    });
    if (!campaign) {
        throw new Error("Campaign not found or unauthorized");
    }
    return campaign;
}
/**
 * List all campaigns for a user
 */
async function listUserCampaigns(userId) {
    return await db_1.prisma.campaign.findMany({
        where: { userId },
        include: {
            steps: {
                orderBy: { stepNumber: "asc" },
            },
            emailAccounts: {
                include: {
                    emailAccount: true,
                },
            },
            leadSearch: {
                select: {
                    id: true,
                    query: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
/**
 * Update campaign status
 */
async function updateCampaignStatus(campaignId, userId, status) {
    const campaign = await db_1.prisma.campaign.findFirst({
        where: {
            id: campaignId,
            userId,
        },
    });
    if (!campaign) {
        throw new Error("Campaign not found or unauthorized");
    }
    await db_1.prisma.campaign.update({
        where: { id: campaignId },
        data: { status },
    });
    logger_1.logger.info("Campaign status updated", {
        campaignId,
        oldStatus: campaign.status,
        newStatus: status,
    });
}
/**
 * Delete a campaign
 */
async function deleteCampaign(campaignId, userId) {
    const campaign = await db_1.prisma.campaign.findFirst({
        where: {
            id: campaignId,
            userId,
        },
    });
    if (!campaign) {
        throw new Error("Campaign not found or unauthorized");
    }
    // Cannot delete running campaigns
    if (campaign.status === "RUNNING") {
        throw new Error("Cannot delete a running campaign. Pause it first.");
    }
    await db_1.prisma.campaign.delete({
        where: { id: campaignId },
    });
    logger_1.logger.info("Campaign deleted", {
        campaignId,
        name: campaign.name,
    });
}
/**
 * Import leads from a lead search into a campaign
 * This queues emails for each lead according to the campaign sequence
 */
async function importLeadsFromSearch(campaignId, userId, options = {}) {
    const campaign = await getCampaignById(campaignId, userId);
    // Check if leads come from list or search
    let leads;
    if (campaign.listId) {
        // Import from list
        const { getListLeads } = await Promise.resolve().then(() => __importStar(require("../lists/listService")));
        leads = await getListLeads(campaign.listId, userId);
        // Apply filters if provided
        if (options.industry) {
            leads = leads.filter((l) => l.industry === options.industry);
        }
        if (options.sizeBucket) {
            leads = leads.filter((l) => l.sizeBucket === options.sizeBucket);
        }
        if (options.country) {
            leads = leads.filter((l) => l.country === options.country);
        }
        if (options.decisionMakerOnly) {
            leads = leads.filter((l) => l.isLikelyDecisionMaker);
        }
        if (options.limit) {
            leads = leads.slice(0, options.limit);
        }
    }
    else if (campaign.leadSearchId) {
        // Import from lead search
        const { getLeadSearchLeads } = await Promise.resolve().then(() => __importStar(require("../leadSearch/leadSearchService")));
        leads = await getLeadSearchLeads(campaign.leadSearchId, {
            ...options,
            userId,
        });
    }
    else {
        throw new Error("Campaign has no lead source (list or search)");
    }
    if (campaign.emailAccounts.length === 0) {
        throw new Error("Campaign has no email accounts configured");
    }
    if (campaign.steps.length === 0) {
        throw new Error("Campaign has no email steps configured");
    }
    logger_1.logger.info("Importing leads into campaign", {
        campaignId,
        leadCount: leads.length,
    });
    // Queue emails for each lead
    const emailAccounts = campaign.emailAccounts.map((ea) => ea.emailAccount);
    let accountIndex = 0;
    const now = new Date();
    const queuedEmails = [];
    for (const lead of leads) {
        // Get company and contact IDs if available
        const company = lead.companyName
            ? await db_1.prisma.company.findFirst({
                where: { name: lead.companyName },
            })
            : null;
        const contact = lead.email
            ? await db_1.prisma.contact.findFirst({
                where: { email: lead.email },
            })
            : null;
        // Create email for each step in the sequence
        for (const step of campaign.steps) {
            // Rotate email accounts
            const emailAccount = emailAccounts[accountIndex % emailAccounts.length];
            accountIndex++;
            // Calculate scheduled time (step delay + random jitter)
            const scheduledFor = new Date(now);
            scheduledFor.setDate(scheduledFor.getDate() + step.delayDays);
            scheduledFor.setHours(9 + Math.floor(Math.random() * 8)); // Random hour 9-17
            scheduledFor.setMinutes(Math.floor(Math.random() * 60)); // Random minute
            // Determine if this should be A/B variant
            const isVariant = step.variantPercent > 0 && Math.random() * 100 < step.variantPercent;
            // Personalize subject and body
            const personalizedSubject = personalizeTemplate(isVariant && step.variantSubject
                ? step.variantSubject
                : step.subjectLine, lead);
            const personalizedBody = personalizeTemplate(isVariant && step.variantBody ? step.variantBody : step.bodyTemplate, lead);
            const campaignEmail = await db_1.prisma.campaignEmail.create({
                data: {
                    campaignId: campaign.id,
                    emailAccountId: emailAccount.id,
                    recipientEmail: lead.email,
                    recipientName: [lead.firstName, lead.lastName]
                        .filter(Boolean)
                        .join(" ") || null,
                    companyId: company?.id || null,
                    contactId: contact?.id || null,
                    stepNumber: step.stepNumber,
                    isVariant,
                    subject: personalizedSubject,
                    body: personalizedBody,
                    status: "QUEUED",
                    scheduledFor,
                },
            });
            queuedEmails.push(campaignEmail);
        }
    }
    // Update campaign stats
    await db_1.prisma.campaign.update({
        where: { id: campaignId },
        data: {
            totalLeads: leads.length,
            emailsQueued: queuedEmails.length,
        },
    });
    logger_1.logger.info("Leads imported successfully", {
        campaignId,
        leadsImported: leads.length,
        emailsQueued: queuedEmails.length,
    });
    return {
        leadsImported: leads.length,
        emailsQueued: queuedEmails.length,
    };
}
/**
 * Personalize email template with lead data
 * Replaces {firstName}, {lastName}, {companyName}, etc.
 */
function personalizeTemplate(template, lead) {
    return template
        .replace(/{firstName}/g, lead.firstName || "there")
        .replace(/{lastName}/g, lead.lastName || "")
        .replace(/{fullName}/g, [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "there")
        .replace(/{companyName}/g, lead.companyName || "your company")
        .replace(/{company}/g, lead.companyName || "your company")
        .replace(/{website}/g, lead.websiteUrl || "")
        .replace(/{industry}/g, lead.industry || "your industry")
        .replace(/{city}/g, lead.city || "")
        .replace(/{country}/g, lead.country || "");
}
//# sourceMappingURL=campaignService.js.map