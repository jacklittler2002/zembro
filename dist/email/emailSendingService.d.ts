/**
 * Process the email queue and send pending emails
 * This should run periodically (e.g., every 5 minutes via worker)
 */
export declare function processEmailQueue(): Promise<void>;
/**
 * Send a single campaign email
 */
export declare function sendCampaignEmail(campaignEmailId: string): Promise<void>;
/**
 * Track email open (called when tracking pixel is loaded)
 */
export declare function trackEmailOpen(campaignEmailId: string): Promise<void>;
/**
 * Track email reply
 */
export declare function trackEmailReply(campaignEmailId: string): Promise<void>;
/**
 * Track email bounce
 */
export declare function trackEmailBounce(campaignEmailId: string, bounceType: string): Promise<void>;
/**
 * Track email unsubscribe
 */
export declare function trackEmailUnsubscribe(campaignEmailId: string): Promise<void>;
/**
 * Get campaign statistics
 */
export declare function getCampaignStats(campaignId: string): Promise<{
    totalLeads: number;
    emailsQueued: number;
    emailsSent: number;
    emailsOpened: number;
    emailsReplied: number;
    emailsBounced: number;
    emailsFailed: number;
    emailsUnsubscribed: number;
    openRate: number;
    replyRate: number;
    bounceRate: number;
    statusBreakdown: Record<string, number>;
}>;
//# sourceMappingURL=emailSendingService.d.ts.map