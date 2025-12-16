import { CrawlJob, CrawlJobType } from "./jobTypes";
export declare function enqueueJob(params: {
    type: CrawlJobType;
    targetUrl?: string | null;
    companyId?: string | null;
    leadSearchId?: string | null;
    scheduledAt?: Date | null;
    priority?: number;
}): Promise<CrawlJob>;
export declare function fetchNextPendingJob(): Promise<CrawlJob | null>;
export declare function markJobDone(id: string): Promise<void>;
export declare function markJobFailed(id: string, error: unknown): Promise<void>;
//# sourceMappingURL=jobService.d.ts.map