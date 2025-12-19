import { Request, Response, NextFunction } from "express";
/**
 * Policy Middleware for Express.js
 */
export declare class PolicyMiddleware {
    /**
     * Initialize policies with Prisma
     */
    static initialize(): void;
    /**
     * Attach policy enforcer to request
     */
    static attachEnforcer(req: any, res: any, next: any): void;
    /**
     * Generic policy check middleware
     */
    static check(resource: string, action: string, getResource?: (req: Request) => any): (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Data validation middleware
     */
    static validate(resource: string, action?: string): (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Data filtering middleware for responses
     */
    static filter(resource: string, action?: string): (req: any, res: any, next: NextFunction) => Promise<void>;
    /**
     * Business rules middleware
     */
    static businessRules(operation: string, params?: any): (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Credit check middleware
     */
    static checkCredits(requiredCredits: number, operation: string): (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Security middleware
     */
    static security(operation: string): (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * File upload security middleware
     */
    static fileUpload(): (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
}
/**
 * Convenience middleware functions for common use cases
 */
export declare const requireUserAccess: (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validateUserData: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const requireLeadSearchAccess: (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validateLeadSearchData: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const checkLeadSearchLimits: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const requireCampaignAccess: (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validateCampaignData: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const checkCampaignLimits: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const requireApiKeyAccess: (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validateApiKeyData: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const checkApiKeyLimits: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const requireLeadAccess: (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const filterLeadData: (req: any, res: any, next: NextFunction) => Promise<void>;
export declare const requireListAccess: (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validateListData: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const requireCompanyAccess: (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const filterCompanyData: (req: any, res: any, next: NextFunction) => Promise<void>;
export declare const checkLeadSearchCredits: (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkCampaignCredits: (req: any, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const securityCheck: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const fileSecurityCheck: (req: any, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=policyMiddleware.d.ts.map