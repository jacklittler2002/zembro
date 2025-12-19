import { User, PrismaClient } from "@prisma/client";
export interface PolicyContext {
    userId: string;
    user?: User;
    prisma: PrismaClient;
    resource?: any;
    action: string;
}
export interface PolicyResult {
    allowed: boolean;
    reason?: string;
    data?: any;
}
/**
 * Base Policy class that all policies extend
 */
export declare abstract class BasePolicy {
    abstract name: string;
    /**
     * Check if the action is allowed
     */
    abstract check(context: PolicyContext): Promise<PolicyResult>;
    /**
     * Filter data based on policy rules
     */
    filterData?(context: PolicyContext, data: any): Promise<any>;
    /**
     * Validate data before operations
     */
    validateData?(context: PolicyContext, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}
/**
 * User Policy - Controls user-related operations
 */
export declare class UserPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    validateData(context: PolicyContext, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}
/**
 * Lead Search Policy - Controls lead search operations
 */
export declare class LeadSearchPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    validateData(context: PolicyContext, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    private getUserPlanLimits;
}
/**
 * Credit Policy - Controls credit usage and limits
 */
export declare class CreditPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
}
/**
 * Campaign Policy - Controls email campaign operations
 */
export declare class CampaignPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    validateData(context: PolicyContext, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}
/**
 * API Key Policy - Controls API key operations
 */
export declare class ApiKeyPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    validateData(context: PolicyContext, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}
/**
 * File Upload Policy - Controls file operations
 */
export declare class FileUploadPolicy extends BasePolicy {
    name: string;
    private readonly ALLOWED_TYPES;
    private readonly MAX_FILE_SIZE;
    check(context: PolicyContext): Promise<PolicyResult>;
}
/**
 * Integration Policy - Controls third-party integrations
 */
export declare class IntegrationPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    validateData(context: PolicyContext, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}
//# sourceMappingURL=basePolicies.d.ts.map