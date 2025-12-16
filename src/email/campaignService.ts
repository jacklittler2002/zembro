import { prisma } from "../db";
import { logger } from "../logger";

export interface CreateCampaignInput {
  userId: string;
  name: string;
  leadSearchId?: string;
  listId?: string; // NEW: Support importing from lists
  emailAccountIds: string[]; // Email accounts to rotate
  steps: Array<{
    stepNumber: number;
    delayDays: number;
    subjectLine: string;
    bodyTemplate: string;
    variantSubject?: string;
    variantBody?: string;
    variantPercent?: number;
  }>;
  scheduleStartAt?: Date;
  scheduleEndAt?: Date;
  sendTimeStart?: string; // e.g., "09:00"
  sendTimeEnd?: string; // e.g., "17:00"
  timezone?: string;
  dailyLimit?: number;
}

/**
 * Create a new email campaign
 */
export async function createCampaign(input: CreateCampaignInput) {
  logger.info("Creating campaign", {
    userId: input.userId,
    name: input.name,
    emailAccountCount: input.emailAccountIds.length,
    stepCount: input.steps.length,
  });

  // Verify all email accounts belong to user
  const emailAccounts = await prisma.emailAccount.findMany({
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
    const leadSearch = await prisma.leadSearch.findFirst({
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
    const list = await prisma.list.findFirst({
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
  const campaign = await prisma.campaign.create({
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

  logger.info("Campaign created successfully", {
    campaignId: campaign.id,
    name: campaign.name,
  });

  return campaign;
}

/**
 * Get campaign by ID with full details
 */
export async function getCampaignById(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findFirst({
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
export async function listUserCampaigns(userId: string) {
  return await prisma.campaign.findMany({
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
export async function updateCampaignStatus(
  campaignId: string,
  userId: string,
  status: "DRAFT" | "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED"
) {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found or unauthorized");
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status },
  });

  logger.info("Campaign status updated", {
    campaignId,
    oldStatus: campaign.status,
    newStatus: status,
  });
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findFirst({
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

  await prisma.campaign.delete({
    where: { id: campaignId },
  });

  logger.info("Campaign deleted", {
    campaignId,
    name: campaign.name,
  });
}

/**
 * Import leads from a lead search into a campaign
 * This queues emails for each lead according to the campaign sequence
 */
export async function importLeadsFromSearch(
  campaignId: string,
  userId: string,
  options: {
    minScore?: number;
    industry?: string;
    sizeBucket?: string;
    country?: string;
    decisionMakerOnly?: boolean;
    excludePreviousExports?: boolean;
    limit?: number;
  } = {}
) {
  const campaign = await getCampaignById(campaignId, userId);

  // Check if leads come from list or search
  let leads: any[];

  if (campaign.listId) {
    // Import from list
    const { getListLeads } = await import("../lists/listService");
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
  } else if (campaign.leadSearchId) {
    // Import from lead search
    const { getLeadSearchLeads } = await import("../leadSearch/leadSearchService");
    leads = await getLeadSearchLeads(campaign.leadSearchId, {
      ...options,
      userId,
    });
  } else {
    throw new Error("Campaign has no lead source (list or search)");
  }

  if (campaign.emailAccounts.length === 0) {
    throw new Error("Campaign has no email accounts configured");
  }

  if (campaign.steps.length === 0) {
    throw new Error("Campaign has no email steps configured");
  }

  logger.info("Importing leads into campaign", {
    campaignId,
    leadCount: leads.length,
  });

  // Queue emails for each lead
  const emailAccounts = campaign.emailAccounts.map((ea: any) => ea.emailAccount);
  let accountIndex = 0;

  const now = new Date();
  const queuedEmails = [];

  for (const lead of leads) {
    // Get company and contact IDs if available
    const company = lead.companyName
      ? await prisma.company.findFirst({
          where: { name: lead.companyName },
        })
      : null;

    const contact = lead.email
      ? await prisma.contact.findFirst({
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
      const isVariant =
        step.variantPercent > 0 && Math.random() * 100 < step.variantPercent;

      // Personalize subject and body
      const personalizedSubject = personalizeTemplate(
        isVariant && step.variantSubject
          ? step.variantSubject
          : step.subjectLine,
        lead
      );

      const personalizedBody = personalizeTemplate(
        isVariant && step.variantBody ? step.variantBody : step.bodyTemplate,
        lead
      );

      const campaignEmail = await prisma.campaignEmail.create({
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
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      totalLeads: leads.length,
      emailsQueued: queuedEmails.length,
    },
  });

  logger.info("Leads imported successfully", {
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
function personalizeTemplate(
  template: string,
  lead: {
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string;
    websiteUrl?: string | null;
    industry?: string | null;
    city?: string | null;
    country?: string | null;
  }
): string {
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
