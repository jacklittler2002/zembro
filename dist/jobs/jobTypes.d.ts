export type CrawlJobType = "DISCOVERY" | "SITE_CRAWL" | "ENRICHMENT";
export type CrawlJobStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";
export interface CrawlJob {
    id: string;
    type: CrawlJobType;
    status: CrawlJobStatus;
    targetUrl: string | null;
    attempts: number;
    lastError: string | null;
    scheduledAt: Date | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    priority: number;
    companyId: string | null;
    leadSearchId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=jobTypes.d.ts.map