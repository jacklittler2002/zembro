import { PolicyAwareService } from "../policies/policyIntegration";
export interface CreateLeadSearchInput {
    userId?: string;
    query: string;
    maxLeads?: number;
    filters?: any;
}
/**
 * Lead Search Service with Policy Enforcement
 * Extends PolicyAwareService for automatic policy checks
 */
export declare class LeadSearchService extends PolicyAwareService {
    /**
     * Create a new LeadSearch with policy enforcement
     */
    createLeadSearch(input: CreateLeadSearchInput): Promise<{
        query: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.LeadSearchStatus;
        niche: string | null;
        location: string | null;
        maxLeads: number;
        errorMessage: string | null;
        filters: import("@prisma/client/runtime/client").JsonValue | null;
        contactsFoundCount: number;
        crawledCount: number;
        discoveredCount: number;
        enrichedCount: number;
        creditsCharged: number;
        totalFound: number;
        totalDeduped: number;
        totalNetNew: number;
    }>;
    /**
     * Get a LeadSearch by ID with policy filtering
     */
    getLeadSearchById(userId: string, id: string): Promise<any>; /**
     * Update LeadSearch status with policy checks
     */
    markLeadSearchStatus(userId: string, id: string, status: "PENDING" | "RUNNING" | "DONE" | "FAILED", errorMessage?: string): Promise<void>;
}
/**
 * Create a new LeadSearch and immediately enqueue a DISCOVERY job
 * @deprecated Use LeadSearchService.createLeadSearch() instead
 */
export declare function createLeadSearch(input: CreateLeadSearchInput): Promise<{
    query: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    status: import(".prisma/client").$Enums.LeadSearchStatus;
    niche: string | null;
    location: string | null;
    maxLeads: number;
    errorMessage: string | null;
    filters: import("@prisma/client/runtime/client").JsonValue | null;
    contactsFoundCount: number;
    crawledCount: number;
    discoveredCount: number;
    enrichedCount: number;
    creditsCharged: number;
    totalFound: number;
    totalDeduped: number;
    totalNetNew: number;
}>;
/**
 * Get a LeadSearch by ID
 * @deprecated Use LeadSearchService.getLeadSearchById() instead
 */
export declare function getLeadSearchById(id: string): Promise<{
    query: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    status: import(".prisma/client").$Enums.LeadSearchStatus;
    niche: string | null;
    location: string | null;
    maxLeads: number;
    errorMessage: string | null;
    filters: import("@prisma/client/runtime/client").JsonValue | null;
    contactsFoundCount: number;
    crawledCount: number;
    discoveredCount: number;
    enrichedCount: number;
    creditsCharged: number;
    totalFound: number;
    totalDeduped: number;
    totalNetNew: number;
} | null>;
/**
 * Update LeadSearch status
 * @deprecated Use LeadSearchService.markLeadSearchStatus() instead
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
    jobTitle?: string;
    techStack?: string[];
    fundingStage?: string;
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