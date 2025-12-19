/**
 * Policy Integration Service
 *
 * This service provides easy integration of policies into existing services
 */
export declare class PolicyIntegration {
    /**
     * Initialize all policies - call this once at app startup
     */
    static initialize(): void;
    /**
     * Enhanced service methods with policy checks
     */
    static withPolicy<T>(userId: string, action: string, resource: string, operation: () => Promise<T>, resourceData?: any): Promise<T>;
    /**
     * Enhanced service methods with validation
     */
    static withValidation<T>(userId: string, resource: string, action: string, data: any, operation: () => Promise<T>): Promise<T>;
    /**
     * Enhanced service methods with both policy and validation
     */
    static withPolicyAndValidation<T>(userId: string, action: string, resource: string, data: any, operation: () => Promise<T>): Promise<T>;
}
/**
 * Policy-Aware Service Base Class
 *
 * Extend this class to create services with built-in policy enforcement
 */
export declare abstract class PolicyAwareService {
    protected enforce(userId: string, action: string, resource: string, resourceData?: any): Promise<void>;
    protected validate(userId: string, resource: string, action: string, data: any): Promise<void>;
    protected filter(userId: string, resource: string, action: string, data: any): Promise<any>;
    protected checkCredits(userId: string, requiredCredits: number, operation: string): Promise<void>;
    protected checkPlanLimits(userId: string, operation: string, params?: any): Promise<void>;
}
/**
 * Examples of how to integrate policies into existing services
 */
export declare class EnhancedLeadSearchService extends PolicyAwareService {
    createLeadSearch(userId: string, input: any): Promise<{
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
    getLeadSearch(userId: string, searchId: string): Promise<any>;
}
export declare class EnhancedCampaignService extends PolicyAwareService {
    createCampaign(userId: string, input: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        leadSearchId: string | null;
        status: import(".prisma/client").$Enums.CampaignStatus;
        scheduleStartAt: Date | null;
        scheduleEndAt: Date | null;
        sendTimeStart: string | null;
        sendTimeEnd: string | null;
        timezone: string;
        dailyLimit: number;
        totalLeads: number;
        emailsQueued: number;
        emailsSent: number;
        emailsOpened: number;
        emailsReplied: number;
        emailsBounced: number;
        emailsFailed: number;
        emailsSentToday: number;
        emailsUnsubscribed: number;
        lastResetAt: Date;
        listId: string | null;
    }>;
}
export declare class EnhancedApiKeyService extends PolicyAwareService {
    createApiKey(userId: string, input: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        key: string;
        permissions: import("@prisma/client/runtime/client").JsonValue;
        isActive: boolean;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
    }>;
    private generateApiKey;
}
/**
 * Route Integration Examples
 *
 * These show how to integrate policies into Express routes
 */
export declare const policyRouteExamples: {
    leadSearchRoutes: (app: any) => void;
    campaignRoutes: (app: any) => void;
    apiKeyRoutes: (app: any) => void;
};
/**
 * Error Handling for Policy Violations
 */
export declare class PolicyError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
/**
 * Policy Error Handler Middleware
 */
export declare function policyErrorHandler(error: any, req: any, res: any, next: any): any;
//# sourceMappingURL=policyIntegration.d.ts.map