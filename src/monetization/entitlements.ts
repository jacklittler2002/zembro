export type PlanCode = "FREE" | "STARTER" | "GROWTH" | "SCALE";

export const PLAN_ENTITLEMENTS: Record<PlanCode, {
  // Limits
  maxLeadsPerSearch: number;
  maxActiveSearches: number;
  maxExportContactsPerExport: number;
  crawlMaxPagesPerDomain: number;

  // Feature flags (capabilities)
  canUseAdvancedFilters: boolean;
  canFilterDecisionMakers: boolean;
  canRunTedWorkflows: boolean;
  canCreateUnlimitedLists: boolean;

  // Monthly credit grants
  monthlyCredits: number;

  // UI label helpers
  label: string;
}> = {
  FREE: {
    label: "Free",
    maxLeadsPerSearch: 50,
    maxActiveSearches: 1,
    maxExportContactsPerExport: 200,
    crawlMaxPagesPerDomain: 4,
    canUseAdvancedFilters: false,
    canFilterDecisionMakers: false,
    canRunTedWorkflows: false,
    canCreateUnlimitedLists: false,
    monthlyCredits: 500,
  },
  STARTER: {
    label: "Starter",
    maxLeadsPerSearch: 200,
    maxActiveSearches: 5,
    maxExportContactsPerExport: 2000,
    crawlMaxPagesPerDomain: 6,
    canUseAdvancedFilters: true,
    canFilterDecisionMakers: false,
    canRunTedWorkflows: false,
    canCreateUnlimitedLists: false,
    monthlyCredits: 8000,
  },
  GROWTH: {
    label: "Growth",
    maxLeadsPerSearch: 1000,
    maxActiveSearches: 20,
    maxExportContactsPerExport: 10000,
    crawlMaxPagesPerDomain: 8,
    canUseAdvancedFilters: true,
    canFilterDecisionMakers: true,
    canRunTedWorkflows: true,
    canCreateUnlimitedLists: true,
    monthlyCredits: 30000,
  },
  SCALE: {
    label: "Scale",
    maxLeadsPerSearch: 5000,
    maxActiveSearches: 100,
    maxExportContactsPerExport: 50000,
    crawlMaxPagesPerDomain: 10,
    canUseAdvancedFilters: true,
    canFilterDecisionMakers: true,
    canRunTedWorkflows: true,
    canCreateUnlimitedLists: true,
    monthlyCredits: 60000,
  },
};
