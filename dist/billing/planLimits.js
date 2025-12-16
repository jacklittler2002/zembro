"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = void 0;
exports.PLAN_LIMITS = {
    FREE: { maxLeadSearchMaxLeads: 50, maxLeadSearchActive: 1, maxExportContactsPerExport: 200, maxCrawlPagesPerDomain: 4 },
    STARTER: { maxLeadSearchMaxLeads: 200, maxLeadSearchActive: 5, maxExportContactsPerExport: 2000, maxCrawlPagesPerDomain: 6 },
    GROWTH: { maxLeadSearchMaxLeads: 1000, maxLeadSearchActive: 20, maxExportContactsPerExport: 10000, maxCrawlPagesPerDomain: 8 },
    SCALE: { maxLeadSearchMaxLeads: 5000, maxLeadSearchActive: 100, maxExportContactsPerExport: 50000, maxCrawlPagesPerDomain: 10 },
};
//# sourceMappingURL=planLimits.js.map