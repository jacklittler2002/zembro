export type PlanCode = "FREE" | "STARTER" | "GROWTH" | "SCALE";

export const PLAN_LIMITS: Record<PlanCode, {
  maxLeadSearchMaxLeads: number;
  maxLeadSearchActive: number;
  maxExportContactsPerExport: number;
  maxCrawlPagesPerDomain: number;
}> = {
  FREE:   { maxLeadSearchMaxLeads: 50,   maxLeadSearchActive: 1,  maxExportContactsPerExport: 200,   maxCrawlPagesPerDomain: 4 },
  STARTER:{ maxLeadSearchMaxLeads: 200,  maxLeadSearchActive: 5,  maxExportContactsPerExport: 2000,  maxCrawlPagesPerDomain: 6 },
  GROWTH: { maxLeadSearchMaxLeads: 1000, maxLeadSearchActive: 20, maxExportContactsPerExport: 10000, maxCrawlPagesPerDomain: 8 },
  SCALE:  { maxLeadSearchMaxLeads: 5000, maxLeadSearchActive: 100, maxExportContactsPerExport: 50000, maxCrawlPagesPerDomain: 10 },
};
