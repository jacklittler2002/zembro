export const CREDIT_PRICING = {
  TED_MESSAGE: 1,
  LEAD_SEARCH_START: 25,      // “campaign start” cost to prevent infinite free runs
  CRAWL_COMPANY: 2,
  ENRICH_COMPANY: 3,
  EXPORT_CONTACT: 1,
  // previews should be free but limited by plan caps
} as const;
