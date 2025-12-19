/**
 * Credit costs for various Zembro features
 *
 * Future TODO: Make these dynamic per plan tier
 */
export declare const CREDIT_COSTS: {
    TED_MESSAGE: number;
    DISCOVERY: number;
    CRAWL: number;
    ENRICH: number;
    EXPORT_PER_CONTACT: number;
};
/**
 * Monthly credit grants per subscription plan
 */
export declare const PLAN_MONTHLY_CREDITS: {
    FREE: number;
    STARTER: number;
    GROWTH: number;
    SCALE: number;
};
/**
 * Credit pack options
 */
export declare const CREDIT_PACKS: {
    "5K": {
        credits: number;
        price: number;
        priceId: string | undefined;
    };
    "20K": {
        credits: number;
        price: number;
        priceId: string | undefined;
    };
    "50K": {
        credits: number;
        price: number;
        priceId: string | undefined;
    };
};
/**
 * Subscription plan price IDs
 */
export declare const SUBSCRIPTION_PLANS: {
    FREE: {
        name: string;
        monthlyCredits: number;
        price: number;
        priceId: null;
        trialEligible: boolean;
    };
    STARTER: {
        name: string;
        monthlyCredits: number;
        price: number;
        priceId: string | undefined;
        trialEligible: boolean;
    };
    GROWTH: {
        name: string;
        monthlyCredits: number;
        price: number;
        priceId: string | undefined;
        trialEligible: boolean;
    };
    SCALE: {
        name: string;
        monthlyCredits: number;
        price: number;
        priceId: string | undefined;
        trialEligible: boolean;
    };
};
//# sourceMappingURL=creditPricing.d.ts.map