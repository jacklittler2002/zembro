export declare function getBillingStatus(userId: string): Promise<{
    stripeCustomerId: string | null;
    planCode: string;
    subscriptionStatus: string;
    currentPeriodEnd: Date | null;
    credits: number;
}>;
//# sourceMappingURL=billingStatusService.d.ts.map