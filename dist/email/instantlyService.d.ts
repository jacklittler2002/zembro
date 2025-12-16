/**
 * Webhook handler for Instantly email account provisioning
 * Called when Instantly finishes provisioning email accounts for a user
 */
export declare function handleInstantlyWebhook(payload: {
    orderId: string;
    customerId: string;
    accounts: Array<{
        email: string;
        domain: string;
        smtp: {
            host: string;
            port: number;
            username: string;
            password: string;
            secure: boolean;
        };
        imap: {
            host: string;
            port: number;
            username: string;
            password: string;
        };
        instantlyAccountId: string;
        warmupStatus: string;
    }>;
}): Promise<{
    success: boolean;
    accountsCreated: number;
    accounts: {
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.EmailAccountStatus;
    }[];
}>;
/**
 * Initiate purchase of email accounts via Instantly
 * (This would call Instantly's API - placeholder for now)
 */
export declare function purchaseInstantlyAccounts(userId: string, quantity: number): Promise<{
    orderId: string;
    status: string;
    estimatedTime: string;
}>;
/**
 * Check if Instantly integration is available
 */
export declare function isInstantlyEnabled(): boolean;
//# sourceMappingURL=instantlyService.d.ts.map