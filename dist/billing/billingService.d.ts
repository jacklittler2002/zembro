/**
 * Get or create a Stripe customer and BillingCustomer record for a user
 */
export declare function getOrCreateBillingCustomer(userId: string, email: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    stripeCustomerId: string;
}>;
/**
 * Get billing customer by user ID
 */
export declare function getBillingCustomer(userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    stripeCustomerId: string;
} | null>;
/**
 * Get active subscription for a user
 */
export declare function getActiveSubscription(userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    status: string;
    stripeSubscriptionId: string;
    planCode: string;
    currentPeriodEnd: Date;
} | null>;
/**
 * Create a Stripe checkout URL for subscription upgrade
 */
export declare function createSubscriptionCheckoutUrl(userId: string, planCode: "STARTER" | "GROWTH" | "SCALE"): Promise<string>;
/**
 * Create a Stripe checkout URL for credit pack purchase
 */
export declare function createCreditPackCheckoutUrl(userId: string, packCode: "5K" | "20K"): Promise<string>;
//# sourceMappingURL=billingService.d.ts.map