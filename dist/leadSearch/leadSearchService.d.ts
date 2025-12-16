export interface CreateLeadSearchInput {
    userId?: string;
    query: string;
    maxLeads?: number;
    filters?: any;
}
/**
 * Create a new LeadSearch and immediately enqueue a DISCOVERY job
 */
export declare function createLeadSearch(input: CreateLeadSearchInput): Promise<{
    query: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    niche: string | null;
    location: string | null;
    maxLeads: number;
    status: import(".prisma/client").$Enums.LeadSearchStatus;
    errorMessage: string | null;
    filters: import("@prisma/client/runtime/client").JsonValue | null;
}>;
/**
 * Get a LeadSearch by ID
 */
export declare function getLeadSearchById(id: string): Promise<{
    query: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    niche: string | null;
    location: string | null;
    maxLeads: number;
    status: import(".prisma/client").$Enums.LeadSearchStatus;
    errorMessage: string | null;
    filters: import("@prisma/client/runtime/client").JsonValue | null;
} | null>;
/**
 * Update LeadSearch status
 */
export declare function markLeadSearchStatus(id: string, status: "PENDING" | "RUNNING" | "DONE" | "FAILED", errorMessage?: string): Promise<void>;
export interface LeadSearchLeadOptions {
    limit?: number;
    minScore?: number;
    industry?: string;
    sizeBucket?: string;
    country?: string;
    decisionMakerOnly?: boolean;
    excludePreviousExports?: boolean;
    userId?: string;
}
/**
 * Get all leads (contacts) associated with a LeadSearch with advanced filtering
 *
 * TODO: More precise linking between LeadSearch and Company (currently uses relation)
 * TODO: Plan-based limits for different subscription tiers
 * TODO: Add caching for expensive queries
 */
export declare function getLeadSearchLeads(id: string, options?: LeadSearchLeadOptions): Promise<Array<{
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string;
    websiteUrl: string | null;
    city: string | null;
    country: string | null;
    niche: string | null;
    industry: string | null;
    sizeBucket: string | null;
    role: string | null;
    isDecisionMaker: boolean;
    score: number | null;
}>>;
//# sourceMappingURL=leadSearchService.d.ts.map