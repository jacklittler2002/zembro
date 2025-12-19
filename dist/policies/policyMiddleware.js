"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileSecurityCheck = exports.securityCheck = exports.checkCampaignCredits = exports.checkLeadSearchCredits = exports.filterCompanyData = exports.requireCompanyAccess = exports.validateListData = exports.requireListAccess = exports.filterLeadData = exports.requireLeadAccess = exports.checkApiKeyLimits = exports.validateApiKeyData = exports.requireApiKeyAccess = exports.checkCampaignLimits = exports.validateCampaignData = exports.requireCampaignAccess = exports.checkLeadSearchLimits = exports.validateLeadSearchData = exports.requireLeadSearchAccess = exports.validateUserData = exports.requireUserAccess = exports.PolicyMiddleware = void 0;
const policyRegistry_1 = require("../policies/policyRegistry");
const db_1 = require("../db");
/**
 * Policy Middleware for Express.js
 */
class PolicyMiddleware {
    /**
     * Initialize policies with Prisma
     */
    static initialize() {
        policyRegistry_1.PolicyRegistry.initialize(db_1.prisma);
    }
    /**
     * Attach policy enforcer to request
     */
    static attachEnforcer(req, res, next) {
        req.policyEnforcer = policyRegistry_1.PolicyRegistry.getEnforcer();
        req.policyGuard = policyRegistry_1.PolicyGuard;
        req.businessRules = policyRegistry_1.BusinessRules;
        req.securityPolicies = policyRegistry_1.SecurityPolicies;
        next();
    }
    /**
     * Generic policy check middleware
     */
    static check(resource, action, getResource) {
        return async (req, res, next) => {
            try {
                const userId = req.userId || req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: "Authentication required" });
                }
                const resourceData = getResource ? getResource(req) : req.body;
                const allowed = await policyRegistry_1.PolicyGuard.can(userId, action, resource, resourceData);
                if (!allowed) {
                    return res.status(403).json({ error: `Access denied: cannot ${action} ${resource}` });
                }
                next();
            }
            catch (error) {
                console.error("Policy check error:", error);
                res.status(500).json({ error: "Policy enforcement failed" });
            }
        };
    }
    /**
     * Data validation middleware
     */
    static validate(resource, action = "create") {
        return async (req, res, next) => {
            try {
                const userId = req.userId || req.user?.id;
                if (!userId) {
                    return next(); // Skip validation if no user
                }
                const validation = await policyRegistry_1.PolicyGuard.validateData(userId, resource, action, req.body);
                if (!validation.valid) {
                    return res.status(400).json({
                        error: "Validation failed",
                        details: validation.errors
                    });
                }
                next();
            }
            catch (error) {
                console.error("Validation error:", error);
                res.status(500).json({ error: "Validation failed" });
            }
        };
    }
    /**
     * Data filtering middleware for responses
     */
    static filter(resource, action = "read") {
        return async (req, res, next) => {
            // Store original json method
            const originalJson = res.json;
            // Override json method to filter data
            res.json = async function (data) {
                try {
                    const userId = req.userId || req.user?.id;
                    if (userId) {
                        data = await policyRegistry_1.PolicyGuard.filterData(userId, resource, action, data);
                    }
                    // Call original json method
                    return originalJson.call(this, data);
                }
                catch (error) {
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
    static businessRules(operation, params) {
        return async (req, res, next) => {
            try {
                const userId = req.userId || req.user?.id;
                if (!userId) {
                    return next();
                }
                const rulesCheck = await policyRegistry_1.BusinessRules.checkPlanLimits(userId, operation, params || req.body);
                if (!rulesCheck.allowed) {
                    return res.status(429).json({
                        error: `Plan limit exceeded for ${operation}`,
                        limit: rulesCheck.limit,
                        current: rulesCheck.current
                    });
                }
                next();
            }
            catch (error) {
                console.error("Business rules error:", error);
                res.status(500).json({ error: "Business rules check failed" });
            }
        };
    }
    /**
     * Credit check middleware
     */
    static checkCredits(requiredCredits, operation) {
        return async (req, res, next) => {
            try {
                const userId = req.userId || req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: "Authentication required" });
                }
                const creditCheck = await policyRegistry_1.BusinessRules.checkCreditBalance(userId, requiredCredits, operation);
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
            }
            catch (error) {
                console.error("Credit check error:", error);
                res.status(500).json({ error: "Credit check failed" });
            }
        };
    }
    /**
     * Security middleware
     */
    static security(operation) {
        return async (req, res, next) => {
            try {
                const userId = req.userId || req.user?.id;
                if (!userId) {
                    return next();
                }
                // Check rate limiting
                const rateLimit = await policyRegistry_1.SecurityPolicies.checkRateLimit(userId, operation);
                if (!rateLimit.allowed) {
                    return res.status(429).json({
                        error: "Rate limit exceeded",
                        retryAfter: Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000)
                    });
                }
                // Check for suspicious activity
                const suspicious = await policyRegistry_1.SecurityPolicies.checkSuspiciousActivity(userId, operation, req.body);
                if (suspicious.suspicious) {
                    console.warn(`Suspicious activity detected for user ${userId}:`, suspicious.reasons);
                    // Could log to audit system or take additional actions
                }
                // Sanitize input
                if (req.body) {
                    req.body = policyRegistry_1.SecurityPolicies.sanitizeInput(req.body);
                }
                next();
            }
            catch (error) {
                console.error("Security check error:", error);
                res.status(500).json({ error: "Security check failed" });
            }
        };
    }
    /**
     * File upload security middleware
     */
    static fileUpload() {
        return async (req, res, next) => {
            try {
                const userId = req.userId || req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: "Authentication required" });
                }
                if (!req.file) {
                    return next();
                }
                const fileCheck = await policyRegistry_1.BusinessRules.checkFileUpload(userId, {
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
            }
            catch (error) {
                console.error("File upload check error:", error);
                res.status(500).json({ error: "File upload validation failed" });
            }
        };
    }
}
exports.PolicyMiddleware = PolicyMiddleware;
/**
 * Convenience middleware functions for common use cases
 */
// User policies
exports.requireUserAccess = PolicyMiddleware.check("user", "read");
exports.validateUserData = PolicyMiddleware.validate("user");
// Lead search policies
exports.requireLeadSearchAccess = PolicyMiddleware.check("leadSearch", "read");
exports.validateLeadSearchData = PolicyMiddleware.validate("leadSearch");
exports.checkLeadSearchLimits = PolicyMiddleware.businessRules("lead_search");
// Campaign policies
exports.requireCampaignAccess = PolicyMiddleware.check("campaign", "read");
exports.validateCampaignData = PolicyMiddleware.validate("campaign");
exports.checkCampaignLimits = PolicyMiddleware.businessRules("campaign");
// API key policies
exports.requireApiKeyAccess = PolicyMiddleware.check("apiKey", "read");
exports.validateApiKeyData = PolicyMiddleware.validate("apiKey");
exports.checkApiKeyLimits = PolicyMiddleware.businessRules("api_key");
// Lead policies
exports.requireLeadAccess = PolicyMiddleware.check("lead", "read");
exports.filterLeadData = PolicyMiddleware.filter("lead");
// List policies
exports.requireListAccess = PolicyMiddleware.check("list", "read");
exports.validateListData = PolicyMiddleware.validate("list");
// Company policies
exports.requireCompanyAccess = PolicyMiddleware.check("company", "read");
exports.filterCompanyData = PolicyMiddleware.filter("company");
// Credit policies
exports.checkLeadSearchCredits = PolicyMiddleware.checkCredits(25, "lead_search");
exports.checkCampaignCredits = PolicyMiddleware.checkCredits(10, "campaign_create");
// Security policies
exports.securityCheck = PolicyMiddleware.security("general");
exports.fileSecurityCheck = PolicyMiddleware.fileUpload();
//# sourceMappingURL=policyMiddleware.js.map