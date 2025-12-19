import { Request, Response, NextFunction } from "express";
import { PolicyRegistry, PolicyGuard, BusinessRules, SecurityPolicies } from "../policies/policyRegistry";
import { prisma } from "../db";

/**
 * Policy Middleware for Express.js
 */
export class PolicyMiddleware {
  /**
   * Initialize policies with Prisma
   */
  static initialize() {
    PolicyRegistry.initialize(prisma);
  }

  /**
   * Attach policy enforcer to request
   */
  static attachEnforcer(req: any, res: any, next: any) {
    req.policyEnforcer = PolicyRegistry.getEnforcer();
    req.policyGuard = PolicyGuard;
    req.businessRules = BusinessRules;
    req.securityPolicies = SecurityPolicies;
    next();
  }

  /**
   * Generic policy check middleware
   */
  static check(
    resource: string,
    action: string,
    getResource?: (req: Request) => any
  ) {
    return async (req: any, res: Response, next: NextFunction) => {
      try {
        const userId = req.userId || req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const resourceData = getResource ? getResource(req) : req.body;
        const allowed = await PolicyGuard.can(userId, action, resource, resourceData);

        if (!allowed) {
          return res.status(403).json({ error: `Access denied: cannot ${action} ${resource}` });
        }

        next();
      } catch (error: any) {
        console.error("Policy check error:", error);
        res.status(500).json({ error: "Policy enforcement failed" });
      }
    };
  }

  /**
   * Data validation middleware
   */
  static validate(resource: string, action: string = "create") {
    return async (req: any, res: Response, next: NextFunction) => {
      try {
        const userId = req.userId || req.user?.id;
        if (!userId) {
          return next(); // Skip validation if no user
        }

        const validation = await PolicyGuard.validateData(userId, resource, action, req.body);

        if (!validation.valid) {
          return res.status(400).json({
            error: "Validation failed",
            details: validation.errors
          });
        }

        next();
      } catch (error: any) {
        console.error("Validation error:", error);
        res.status(500).json({ error: "Validation failed" });
      }
    };
  }

  /**
   * Data filtering middleware for responses
   */
  static filter(resource: string, action: string = "read") {
    return async (req: any, res: any, next: NextFunction) => {
      // Store original json method
      const originalJson = res.json;

      // Override json method to filter data
      res.json = async function(data: any) {
        try {
          const userId = req.userId || req.user?.id;
          if (userId) {
            data = await PolicyGuard.filterData(userId, resource, action, data);
          }

          // Call original json method
          return originalJson.call(this, data);
        } catch (error: any) {
          console.error("Data filtering error:", error);
          return originalJson.call(this, { error: "Data filtering failed" });
        }
      };

      next();
    };
  }

  /**
   * Business rules middleware
   */
  static businessRules(operation: string, params?: any) {
    return async (req: any, res: Response, next: NextFunction) => {
      try {
        const userId = req.userId || req.user?.id;
        if (!userId) {
          return next();
        }

        const rulesCheck = await BusinessRules.checkPlanLimits(userId, operation, params || req.body);

        if (!rulesCheck.allowed) {
          return res.status(429).json({
            error: `Plan limit exceeded for ${operation}`,
            limit: rulesCheck.limit,
            current: rulesCheck.current
          });
        }

        next();
      } catch (error: any) {
        console.error("Business rules error:", error);
        res.status(500).json({ error: "Business rules check failed" });
      }
    };
  }

  /**
   * Credit check middleware
   */
  static checkCredits(requiredCredits: number, operation: string) {
    return async (req: any, res: Response, next: NextFunction) => {
      try {
        const userId = req.userId || req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const creditCheck = await BusinessRules.checkCreditBalance(userId, requiredCredits, operation);

        if (!creditCheck.sufficient) {
          return res.status(402).json({
            error: "Insufficient credits",
            required: requiredCredits,
            available: creditCheck.currentBalance
          });
        }

        // Attach credit info to request
        req.creditCheck = creditCheck;
        next();
      } catch (error: any) {
        console.error("Credit check error:", error);
        res.status(500).json({ error: "Credit check failed" });
      }
    };
  }

  /**
   * Security middleware
   */
  static security(operation: string) {
    return async (req: any, res: Response, next: NextFunction) => {
      try {
        const userId = req.userId || req.user?.id;
        if (!userId) {
          return next();
        }

        // Check rate limiting
        const rateLimit = await SecurityPolicies.checkRateLimit(userId, operation);
        if (!rateLimit.allowed) {
          return res.status(429).json({
            error: "Rate limit exceeded",
            retryAfter: Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000)
          });
        }

        // Check for suspicious activity
        const suspicious = await SecurityPolicies.checkSuspiciousActivity(userId, operation, req.body);
        if (suspicious.suspicious) {
          console.warn(`Suspicious activity detected for user ${userId}:`, suspicious.reasons);
          // Could log to audit system or take additional actions
        }

        // Sanitize input
        if (req.body) {
          req.body = SecurityPolicies.sanitizeInput(req.body);
        }

        next();
      } catch (error: any) {
        console.error("Security check error:", error);
        res.status(500).json({ error: "Security check failed" });
      }
    };
  }

  /**
   * File upload security middleware
   */
  static fileUpload() {
    return async (req: any, res: Response, next: NextFunction) => {
      try {
        const userId = req.userId || req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        if (!req.file) {
          return next();
        }

        const fileCheck = await BusinessRules.checkFileUpload(userId, {
          size: req.file.size,
          type: req.file.mimetype,
          name: req.file.originalname
        });

        if (!fileCheck.allowed) {
          return res.status(400).json({
            error: "File upload not allowed",
            reason: fileCheck.reason
          });
        }

        next();
      } catch (error: any) {
        console.error("File upload check error:", error);
        res.status(500).json({ error: "File upload validation failed" });
      }
    };
  }
}

/**
 * Convenience middleware functions for common use cases
 */

// User policies
export const requireUserAccess = PolicyMiddleware.check("user", "read");
export const validateUserData = PolicyMiddleware.validate("user");

// Lead search policies
export const requireLeadSearchAccess = PolicyMiddleware.check("leadSearch", "read");
export const validateLeadSearchData = PolicyMiddleware.validate("leadSearch");
export const checkLeadSearchLimits = PolicyMiddleware.businessRules("lead_search");

// Campaign policies
export const requireCampaignAccess = PolicyMiddleware.check("campaign", "read");
export const validateCampaignData = PolicyMiddleware.validate("campaign");
export const checkCampaignLimits = PolicyMiddleware.businessRules("campaign");

// API key policies
export const requireApiKeyAccess = PolicyMiddleware.check("apiKey", "read");
export const validateApiKeyData = PolicyMiddleware.validate("apiKey");
export const checkApiKeyLimits = PolicyMiddleware.businessRules("api_key");

// Lead policies
export const requireLeadAccess = PolicyMiddleware.check("lead", "read");
export const filterLeadData = PolicyMiddleware.filter("lead");

// List policies
export const requireListAccess = PolicyMiddleware.check("list", "read");
export const validateListData = PolicyMiddleware.validate("list");

// Company policies
export const requireCompanyAccess = PolicyMiddleware.check("company", "read");
export const filterCompanyData = PolicyMiddleware.filter("company");

// Credit policies
export const checkLeadSearchCredits = PolicyMiddleware.checkCredits(25, "lead_search");
export const checkCampaignCredits = PolicyMiddleware.checkCredits(10, "campaign_create");

// Security policies
export const securityCheck = PolicyMiddleware.security("general");
export const fileSecurityCheck = PolicyMiddleware.fileUpload();