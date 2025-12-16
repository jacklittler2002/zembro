/**
 * Custom error for credit-related issues
 */
export declare class CreditError extends Error {
    code: string;
    details?: {
        required?: number;
        available?: number;
    } | undefined;
    constructor(code: string, message: string, details?: {
        required?: number;
        available?: number;
    } | undefined);
}
/**
 * Get or create an AI credit wallet for a user.
 * New users start with 100 free credits.
 * Free users get a monthly refresh of 100 credits (capped at 100 total).
 */
export declare function getOrCreateWalletForUser(userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    balance: number;
    lastTopupAt: Date | null;
}>;
/**
 * Get the current credit balance for a user.
 */
export declare function getCreditBalance(userId: string): Promise<number>;
/**
 * Add credits to a user's wallet.
 * Creates a transaction record with the reason and optional metadata.
 */
export declare function addCredits(userId: string, amount: number, reason: string, metadata?: Record<string, any>): Promise<void>;
/**
 * Consume credits from a user's wallet.
 * Throws an error if insufficient credits.
 * Creates a transaction record with the reason and optional metadata.
 */
export declare function consumeCredits(userId: string, amount: number, reason: string, metadata?: Record<string, any>): Promise<void>;
//# sourceMappingURL=creditService.d.ts.map