import { PrismaClient } from "@prisma/client";
import { BasePolicy, PolicyContext, PolicyResult } from "./basePolicies";
/**
 * Policy Enforcer - Central system for enforcing all policies
 */
export declare class PolicyEnforcer {
    private policies;
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Register all available policies
     */
    private registerPolicies;
    /**
     * Register a policy
     */
    register(policy: BasePolicy): void;
    /**
     * Get a policy by name
     */
    getPolicy(name: string): BasePolicy | undefined;
    /**
     * Enforce a policy check
     */
    enforce(policyName: string, context: Omit<PolicyContext, 'prisma'>): Promise<PolicyResult>;
    /**
     * Validate data using policy rules
     */
    validateData(policyName: string, context: Omit<PolicyContext, 'prisma'>, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Filter data using policy rules
     */
    filterData(policyName: string, context: Omit<PolicyContext, 'prisma'>, data: any): Promise<any>;
    /**
     * Check multiple policies at once
     */
    enforceMultiple(checks: Array<{
        policy: string;
        context: Omit<PolicyContext, 'prisma'>;
    }>): Promise<{
        allowed: boolean;
        results: PolicyResult[];
    }>;
}
/**
 * Policy Middleware for Express routes
 */
export declare function createPolicyMiddleware(policyName: string, action: string, getResource?: (req: any) => any): (req: any, res: any, next: any) => Promise<any>;
/**
 * Data Validation Middleware
 */
export declare function createValidationMiddleware(policyName: string, action?: string): (req: any, res: any, next: any) => Promise<any>;
/**
 * Global Policy Context Provider
 */
export declare class PolicyProvider {
    private static instance;
    private enforcer;
    static getInstance(): PolicyProvider;
    setPrisma(prisma: PrismaClient): void;
    getEnforcer(): PolicyEnforcer;
}
/**
 * Helper function to get policy enforcer
 */
export declare function getPolicyEnforcer(): PolicyEnforcer;
/**
 * Initialize policies with Prisma client
 */
export declare function initializePolicies(prisma: PrismaClient): void;
//# sourceMappingURL=policyEnforcer.d.ts.map