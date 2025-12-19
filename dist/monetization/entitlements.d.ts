export type PlanCode = "FREE" | "STARTER" | "GROWTH" | "SCALE";
export declare const PLAN_ENTITLEMENTS: Record<PlanCode, {
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
}>;
//# sourceMappingURL=entitlements.d.ts.map