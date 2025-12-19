import { PLAN_ENTITLEMENTS, PlanCode } from "./entitlements";
export declare class PlanLimitError extends Error {
    details: any;
    code: "PLAN_LIMIT_REACHED";
    constructor(details: any);
}
export declare class InsufficientCreditsError extends Error {
    details: any;
    code: "INSUFFICIENT_CREDITS";
    constructor(details: any);
}
export declare function getEntitlements(plan: PlanCode): {
    maxLeadsPerSearch: number;
    maxActiveSearches: number;
    maxExportContactsPerExport: number;
    crawlMaxPagesPerDomain: number;
    canUseAdvancedFilters: boolean;
    canFilterDecisionMakers: boolean;
    canRunTedWorkflows: boolean;
    canCreateUnlimitedLists: boolean;
    monthlyCredits: number;
    label: string;
};
export declare function requireCredits(userId: string, amount: number, reason: string): Promise<void>;
export declare function requireFeature(plan: PlanCode, flag: keyof typeof PLAN_ENTITLEMENTS["FREE"]): void;
export declare function clampByPlan(plan: PlanCode, value: number, limitKey: "maxLeadsPerSearch" | "maxExportContactsPerExport" | "crawlMaxPagesPerDomain"): number;
//# sourceMappingURL=enforce.d.ts.map