import { PolicyEnforcer } from "./policyEnforcer";
/**
 * Master Policy Registry - All policies in one place
 */
export declare class PolicyRegistry {
    private static enforcer;
    /**
     * Initialize all policies with Prisma client
     */
    static initialize(prisma: any): void;
    /**
     * Get the policy enforcer instance
     */
    static getEnforcer(): PolicyEnforcer;
    /**
     * Quick policy check
     */
    static check(policy: string, userId: string, action: string, resource?: any): Promise<boolean>;
    /**
     * Quick data validation
     */
    static validate(policy: string, userId: string, action: string, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Quick data filtering
     */
    static filter(policy: string, userId: string, action: string, data: any): Promise<any>;
}
/**
 * Policy Guard Functions - Easy-to-use policy checks
 */
export declare class PolicyGuard {
    /**
     * Check if user can perform action on resource
     */
    static can(userId: string, action: string, resource: string, resourceData?: any): Promise<boolean>;
    /**
     * Check if user can create a resource
     */
    static canCreate(userId: string, resource: string, data?: any): Promise<boolean>;
    /**
     * Check if user can read a resource
     */
    static canRead(userId: string, resource: string, resourceData?: any): Promise<boolean>;
    /**
     * Check if user can update a resource
     */
    static canUpdate(userId: string, resource: string, resourceData?: any): Promise<boolean>;
    /**
     * Check if user can delete a resource
     */
    static canDelete(userId: string, resource: string, resourceData?: any): Promise<boolean>;
    /**
     * Validate data for a resource
     */
    static validateData(userId: string, resource: string, action: string, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Filter data based on user permissions
     */
    static filterData(userId: string, resource: string, action: string, data: any): Promise<any>;
    /**
     * Enforce policy or throw error
     */
    static enforce(userId: string, action: string, resource: string, resourceData?: any, errorMessage?: string): Promise<void>;
    /**
     * Validate data or throw error
     */
    static enforceValidation(userId: string, resource: string, action: string, data: any, errorMessage?: string): Promise<void>;
}
/**
 * Business Rule Policies - Domain-specific rules
 */
export declare class BusinessRules {
    /**
     * Check if user has sufficient credits for operation
     */
    static checkCreditBalance(userId: string, requiredCredits: number, operation: string): Promise<{
        sufficient: boolean;
        currentBalance: number;
    }>;
    /**
     * Check plan limits for operation
     */
    static checkPlanLimits(userId: string, operation: string, params?: any): Promise<{
        allowed: boolean;
        limit?: number;
        current?: number;
    }>;
    /**
     * Check file upload constraints
     */
    static checkFileUpload(userId: string, file: {
        size: number;
        type: string;
        name: string;
    }): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * Validate business rules for lead search
     */
    static validateLeadSearch(userId: string, searchData: {
        query: string;
        maxLeads?: number;
        filters?: any;
    }): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    private static extractLimitFromReason;
    private static getCurrentUsage;
}
/**
 * Security Policies - Additional security checks
 */
export declare class SecurityPolicies {
    /**
     * Rate limiting check
     */
    static checkRateLimit(userId: string, operation: string, windowMinutes?: number, maxRequests?: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: Date;
    }>;
    /**
     * Check for suspicious activity
     */
    static checkSuspiciousActivity(_userId: string, _action: string, _data?: any): Promise<{
        suspicious: boolean;
        reasons: string[];
    }>;
    /**
     * Data sanitization
     */
    static sanitizeInput(data: any): any;
}
//# sourceMappingURL=policyRegistry.d.ts.map