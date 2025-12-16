export interface EmailAccountConfig {
    email: string;
    provider: "gmail" | "outlook" | "smtp" | "instantly";
    fromName?: string;
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpSecure?: boolean;
    imapHost?: string;
    imapPort?: number;
    imapUsername?: string;
    imapPassword?: string;
    dailySendLimit?: number;
    warmupEnabled?: boolean;
}
/**
 * Test SMTP connection to verify credentials work
 */
export declare function testSmtpConnection(config: {
    host: string;
    port: number;
    username: string;
    password: string;
    secure?: boolean;
}): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Add a new email account for a user (BYOE - Bring Your Own Email)
 */
export declare function addEmailAccount(userId: string, config: EmailAccountConfig): Promise<{
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
}>;
/**
 * Get decrypted SMTP credentials for sending
 */
export declare function getSmtpCredentials(emailAccountId: string): Promise<{
    email: string;
    fromName: string | null;
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpSecure: boolean;
}>;
/**
 * Get all email accounts for a user
 */
export declare function getUserEmailAccounts(userId: string): Promise<{
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
}[]>;
/**
 * Delete an email account
 */
export declare function deleteEmailAccount(userId: string, emailAccountId: string): Promise<void>;
/**
 * Update email account status
 */
export declare function updateEmailAccountStatus(emailAccountId: string, status: "ACTIVE" | "PAUSED" | "WARMING_UP" | "FAILED" | "SUSPENDED"): Promise<void>;
/**
 * Increment daily sent count and check limits
 */
export declare function trackEmailSent(emailAccountId: string): Promise<{
    withinLimit: boolean;
    remaining: number;
    error?: never;
} | {
    withinLimit: boolean;
    remaining: number;
    error: string;
}>;
/**
 * Get provider presets for common email services
 */
export declare function getProviderPreset(provider: "gmail" | "outlook"): {
    smtpHost: string;
    smtpPort: number;
    imapHost: string;
    imapPort: number;
};
//# sourceMappingURL=emailAccountService.d.ts.map