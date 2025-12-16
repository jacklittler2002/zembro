export interface CreateCampaignInput {
    userId: string;
    name: string;
    leadSearchId?: string;
    listId?: string;
    emailAccountIds: string[];
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
    sendTimeStart?: string;
    sendTimeEnd?: string;
    timezone?: string;
    dailyLimit?: number;
}
/**
 * Create a new email campaign
 */
export declare function createCampaign(input: CreateCampaignInput): Promise<{
    emailAccounts: ({
        emailAccount: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.EmailAccountStatus;
            provider: string;
            fromName: string | null;
            smtpHost: string;
            smtpPort: number;
            smtpUsername: string;
            smtpPassword: string;
            smtpSecure: boolean;
            imapHost: string | null;
            imapPort: number | null;
            imapUsername: string | null;
            imapPassword: string | null;
            dailySendLimit: number;
            dailySentCount: number;
            lastSentAt: Date | null;
            lastResetAt: Date;
            warmupEnabled: boolean;
            warmupStage: number;
            warmupStartedAt: Date | null;
            bounceRate: number;
            replyRate: number;
            openRate: number;
            totalSent: number;
            totalBounced: number;
            totalReplied: number;
            instantlyAccountId: string | null;
        };
    } & {
        id: string;
        addedAt: Date;
        campaignId: string;
        emailAccountId: string;
    })[];
    steps: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        stepNumber: number;
        delayDays: number;
        subjectLine: string;
        bodyTemplate: string;
        variantSubject: string | null;
        variantBody: string | null;
        variantPercent: number;
    }[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    status: import(".prisma/client").$Enums.CampaignStatus;
    leadSearchId: string | null;
    lastResetAt: Date;
    listId: string | null;
    scheduleStartAt: Date | null;
    scheduleEndAt: Date | null;
    sendTimeStart: string | null;
    sendTimeEnd: string | null;
    timezone: string;
    dailyLimit: number;
    totalLeads: number;
    emailsQueued: number;
    emailsSent: number;
    emailsSentToday: number;
    emailsOpened: number;
    emailsReplied: number;
    emailsBounced: number;
    emailsFailed: number;
    emailsUnsubscribed: number;
}>;
/**
 * Get campaign by ID with full details
 */
export declare function getCampaignById(campaignId: string, userId: string): Promise<{
    leadSearch: {
        query: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        niche: string | null;
        location: string | null;
        maxLeads: number;
        status: import(".prisma/client").$Enums.LeadSearchStatus;
        errorMessage: string | null;
        filters: import("@prisma/client/runtime/client").JsonValue | null;
    } | null;
    emailAccounts: ({
        emailAccount: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.EmailAccountStatus;
            provider: string;
            fromName: string | null;
            smtpHost: string;
            smtpPort: number;
            smtpUsername: string;
            smtpPassword: string;
            smtpSecure: boolean;
            imapHost: string | null;
            imapPort: number | null;
            imapUsername: string | null;
            imapPassword: string | null;
            dailySendLimit: number;
            dailySentCount: number;
            lastSentAt: Date | null;
            lastResetAt: Date;
            warmupEnabled: boolean;
            warmupStage: number;
            warmupStartedAt: Date | null;
            bounceRate: number;
            replyRate: number;
            openRate: number;
            totalSent: number;
            totalBounced: number;
            totalReplied: number;
            instantlyAccountId: string | null;
        };
    } & {
        id: string;
        addedAt: Date;
        campaignId: string;
        emailAccountId: string;
    })[];
    steps: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        stepNumber: number;
        delayDays: number;
        subjectLine: string;
        bodyTemplate: string;
        variantSubject: string | null;
        variantBody: string | null;
        variantPercent: number;
    }[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    status: import(".prisma/client").$Enums.CampaignStatus;
    leadSearchId: string | null;
    lastResetAt: Date;
    listId: string | null;
    scheduleStartAt: Date | null;
    scheduleEndAt: Date | null;
    sendTimeStart: string | null;
    sendTimeEnd: string | null;
    timezone: string;
    dailyLimit: number;
    totalLeads: number;
    emailsQueued: number;
    emailsSent: number;
    emailsSentToday: number;
    emailsOpened: number;
    emailsReplied: number;
    emailsBounced: number;
    emailsFailed: number;
    emailsUnsubscribed: number;
}>;
/**
 * List all campaigns for a user
 */
export declare function listUserCampaigns(userId: string): Promise<({
    leadSearch: {
        query: string;
        id: string;
    } | null;
    emailAccounts: ({
        emailAccount: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.EmailAccountStatus;
            provider: string;
            fromName: string | null;
            smtpHost: string;
            smtpPort: number;
            smtpUsername: string;
            smtpPassword: string;
            smtpSecure: boolean;
            imapHost: string | null;
            imapPort: number | null;
            imapUsername: string | null;
            imapPassword: string | null;
            dailySendLimit: number;
            dailySentCount: number;
            lastSentAt: Date | null;
            lastResetAt: Date;
            warmupEnabled: boolean;
            warmupStage: number;
            warmupStartedAt: Date | null;
            bounceRate: number;
            replyRate: number;
            openRate: number;
            totalSent: number;
            totalBounced: number;
            totalReplied: number;
            instantlyAccountId: string | null;
        };
    } & {
        id: string;
        addedAt: Date;
        campaignId: string;
        emailAccountId: string;
    })[];
    steps: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        stepNumber: number;
        delayDays: number;
        subjectLine: string;
        bodyTemplate: string;
        variantSubject: string | null;
        variantBody: string | null;
        variantPercent: number;
    }[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    status: import(".prisma/client").$Enums.CampaignStatus;
    leadSearchId: string | null;
    lastResetAt: Date;
    listId: string | null;
    scheduleStartAt: Date | null;
    scheduleEndAt: Date | null;
    sendTimeStart: string | null;
    sendTimeEnd: string | null;
    timezone: string;
    dailyLimit: number;
    totalLeads: number;
    emailsQueued: number;
    emailsSent: number;
    emailsSentToday: number;
    emailsOpened: number;
    emailsReplied: number;
    emailsBounced: number;
    emailsFailed: number;
    emailsUnsubscribed: number;
})[]>;
/**
 * Update campaign status
 */
export declare function updateCampaignStatus(campaignId: string, userId: string, status: "DRAFT" | "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED"): Promise<void>;
/**
 * Delete a campaign
 */
export declare function deleteCampaign(campaignId: string, userId: string): Promise<void>;
/**
 * Import leads from a lead search into a campaign
 * This queues emails for each lead according to the campaign sequence
 */
export declare function importLeadsFromSearch(campaignId: string, userId: string, options?: {
    minScore?: number;
    industry?: string;
    sizeBucket?: string;
    country?: string;
    decisionMakerOnly?: boolean;
    excludePreviousExports?: boolean;
    limit?: number;
}): Promise<{
    leadsImported: number;
    emailsQueued: number;
}>;
//# sourceMappingURL=campaignService.d.ts.map