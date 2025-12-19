export interface LeadDeliveryResult {
    totalFound: number;
    totalDeduped: number;
    totalNetNew: number;
    creditsCharged: number;
    deliveredLeads: Array<{
        contactId: string;
        leadKey: string;
        isNetNew: boolean;
    }>;
}
/**
 * Instantly-style credit charging service.
 * Charges ONLY for net-new unique leads delivered to the user.
 */
export declare class InstantlyCreditService {
    /**
     * Process leads for delivery and charge credits only for net-new leads.
     * This should be called after leads are found but before they're delivered to the user.
     */
    static processLeadDelivery(userId: string, leadSearchId: string, contacts: Array<{
        id: string;
        email: string;
        company: {
            id: string;
            domain?: string | null;
            websiteUrl?: string | null;
            name: string;
            city?: string | null;
            country?: string | null;
            googleMapsPlaceId?: string | null;
        };
    }>): Promise<LeadDeliveryResult>;
    /**
     * Charge credits for net-new leads and create audit trail
     */
    private static chargeCreditsForLeads;
    /**
     * Update lead search statistics
     */
    private static updateLeadSearchStats;
    /**
     * Refund credits for a lead (e.g., if lead is invalid or removed)
     */
    static refundLeadCredit(userId: string, leadSearchId: string, leadKey: string): Promise<void>;
}
//# sourceMappingURL=instantlyCreditService.d.ts.map