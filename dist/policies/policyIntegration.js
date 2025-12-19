"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyError = exports.policyRouteExamples = exports.EnhancedApiKeyService = exports.EnhancedCampaignService = exports.EnhancedLeadSearchService = exports.PolicyAwareService = exports.PolicyIntegration = void 0;
exports.policyErrorHandler = policyErrorHandler;
const policyRegistry_1 = require("../policies/policyRegistry");
const policyMiddleware_1 = require("../policies/policyMiddleware");
const db_1 = require("../db");
const crypto_1 = require("crypto");
/**
 * Policy Integration Service
 *
 * This service provides easy integration of policies into existing services
 */
class PolicyIntegration {
    /**
     * Initialize all policies - call this once at app startup
     */
    static initialize() {
        policyRegistry_1.PolicyRegistry.initialize(db_1.prisma);
        console.log("✅ Policy system initialized");
    }
    /**
     * Enhanced service methods with policy checks
     */
    static async withPolicy(userId, action, resource, operation, resourceData) {
        // Check policy
        await policyRegistry_1.PolicyGuard.enforce(userId, action, resource, resourceData);
        // Execute operation
        return await operation();
    }
    /**
     * Enhanced service methods with validation
     */
    static async withValidation(userId, resource, action, data, operation) {
        // Validate data
        await policyRegistry_1.PolicyGuard.enforceValidation(userId, resource, action, data);
        // Execute operation
        return await operation();
    }
    /**
     * Enhanced service methods with both policy and validation
     */
    static async withPolicyAndValidation(userId, action, resource, data, operation) {
        // Check policy
        await policyRegistry_1.PolicyGuard.enforce(userId, action, resource, data);
        // Validate data
        await policyRegistry_1.PolicyGuard.enforceValidation(userId, resource, action, data);
        // Execute operation
        return await operation();
    }
}
exports.PolicyIntegration = PolicyIntegration;
/**
 * Policy-Aware Service Base Class
 *
 * Extend this class to create services with built-in policy enforcement
 */
class PolicyAwareService {
    async enforce(userId, action, resource, resourceData) {
        await policyRegistry_1.PolicyGuard.enforce(userId, action, resource, resourceData);
    }
    async validate(userId, resource, action, data) {
        await policyRegistry_1.PolicyGuard.enforceValidation(userId, resource, action, data);
    }
    async filter(userId, resource, action, data) {
        return await policyRegistry_1.PolicyGuard.filterData(userId, resource, action, data);
    }
    async checkCredits(userId, requiredCredits, operation) {
        const creditCheck = await policyRegistry_1.BusinessRules.checkCreditBalance(userId, requiredCredits, operation);
        if (!creditCheck.sufficient) {
            throw new Error(`Insufficient credits: ${creditCheck.currentBalance} available, ${requiredCredits} required`);
        }
    }
    async checkPlanLimits(userId, operation, params) {
        const limitCheck = await policyRegistry_1.BusinessRules.checkPlanLimits(userId, operation, params);
        if (!limitCheck.allowed) {
            throw new Error(`Plan limit exceeded for ${operation}`);
        }
    }
}
exports.PolicyAwareService = PolicyAwareService;
/**
 * Examples of how to integrate policies into existing services
 */
// Example: Enhanced Lead Search Service
class EnhancedLeadSearchService extends PolicyAwareService {
    async createLeadSearch(userId, input) {
        // Check permissions
        await this.enforce(userId, "create", "leadSearch");
        // Validate data
        await this.validate(userId, "leadSearch", "create", input);
        // Check that user has some credits available (soft check for Instantly-style)
        const wallet = await db_1.prisma.aiCreditWallet.findUnique({
            where: { userId },
        });
        if (!wallet || wallet.balance <= 0) {
            throw new Error("Insufficient credits to start lead search. At least 1 credit required.");
        }
        // Proceed with creation (no upfront credit charge)
        const leadSearch = await db_1.prisma.leadSearch.create({
            data: {
                userId,
                ...input
            }
        });
        return leadSearch;
    }
    async getLeadSearch(userId, searchId) {
        // Check permissions
        await this.enforce(userId, "read", "leadSearch", { id: searchId });
        // Get and filter data
        const search = await db_1.prisma.leadSearch.findUnique({
            where: { id: searchId },
            include: { companies: true }
        });
        return await this.filter(userId, "leadSearch", "read", search);
    }
}
exports.EnhancedLeadSearchService = EnhancedLeadSearchService;
// Example: Enhanced Campaign Service
class EnhancedCampaignService extends PolicyAwareService {
    async createCampaign(userId, input) {
        // Check permissions
        await this.enforce(userId, "create", "campaign");
        // Validate data
        await this.validate(userId, "campaign", "create", input);
        // Check plan limits
        await this.checkPlanLimits(userId, "campaign");
        // Verify email accounts exist
        const emailAccounts = await db_1.prisma.emailAccount.count({
            where: { userId, status: "ACTIVE" }
        });
        if (emailAccounts === 0) {
            throw new Error("At least one verified email account required");
        }
        // Proceed with creation
        const campaign = await db_1.prisma.campaign.create({
            data: {
                userId,
                ...input
            }
        });
        return campaign;
    }
}
exports.EnhancedCampaignService = EnhancedCampaignService;
// Example: Enhanced API Key Service
class EnhancedApiKeyService extends PolicyAwareService {
    async createApiKey(userId, input) {
        // Check permissions
        await this.enforce(userId, "create", "apiKey");
        // Validate data
        await this.validate(userId, "apiKey", "create", input);
        // Check plan limits
        await this.checkPlanLimits(userId, "api_key");
        // Generate secure key
        const key = this.generateApiKey();
        // Create key
        const apiKey = await db_1.prisma.apiKey.create({
            data: {
                userId,
                name: input.name,
                key,
                permissions: input.permissions || []
            }
        });
        return apiKey;
    }
    generateApiKey() {
        return "zk_" + (0, crypto_1.randomBytes)(32).toString("hex");
    }
}
exports.EnhancedApiKeyService = EnhancedApiKeyService;
/**
 * Route Integration Examples
 *
 * These show how to integrate policies into Express routes
 */
exports.policyRouteExamples = {
    // Lead search routes with policies
    leadSearchRoutes: (app) => {
        app.post("/api/lead-searches", policyMiddleware_1.PolicyMiddleware.attachEnforcer, policyMiddleware_1.PolicyMiddleware.check("leadSearch", "create"), policyMiddleware_1.PolicyMiddleware.validate("leadSearch"), policyMiddleware_1.PolicyMiddleware.businessRules("lead_search"), policyMiddleware_1.PolicyMiddleware.checkCredits(25, "lead_search"), async (req, res) => {
            try {
                const service = new EnhancedLeadSearchService();
                const result = await service.createLeadSearch(req.userId, req.body);
                res.json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        app.get("/api/lead-searches/:id", policyMiddleware_1.PolicyMiddleware.attachEnforcer, policyMiddleware_1.PolicyMiddleware.check("leadSearch", "read", (req) => ({ id: req.params.id })), policyMiddleware_1.PolicyMiddleware.filter("leadSearch"), async (req, res) => {
            try {
                const service = new EnhancedLeadSearchService();
                const result = await service.getLeadSearch(req.userId, req.params.id);
                res.json(result);
            }
            catch (error) {
                res.status(404).json({ error: error.message });
            }
        });
    },
    // Campaign routes with policies
    campaignRoutes: (app) => {
        app.post("/api/campaigns", policyMiddleware_1.PolicyMiddleware.attachEnforcer, policyMiddleware_1.PolicyMiddleware.check("campaign", "create"), policyMiddleware_1.PolicyMiddleware.validate("campaign"), policyMiddleware_1.PolicyMiddleware.businessRules("campaign"), async (req, res) => {
            try {
                const service = new EnhancedCampaignService();
                const result = await service.createCampaign(req.userId, req.body);
                res.json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    // API key routes with policies
    apiKeyRoutes: (app) => {
        app.post("/api/api-keys", policyMiddleware_1.PolicyMiddleware.attachEnforcer, policyMiddleware_1.PolicyMiddleware.check("apiKey", "create"), policyMiddleware_1.PolicyMiddleware.validate("apiKey"), policyMiddleware_1.PolicyMiddleware.businessRules("api_key"), async (req, res) => {
            try {
                const service = new EnhancedApiKeyService();
                const result = await service.createApiKey(req.userId, req.body);
                res.json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    }
};
/**
 * Error Handling for Policy Violations
 */
class PolicyError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 403) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "PolicyError";
    }
}
exports.PolicyError = PolicyError;
/**
 * Policy Error Handler Middleware
 */
function policyErrorHandler(error, req, res, next) {
    if (error instanceof PolicyError) {
        return res.status(error.statusCode).json({
            error: error.message,
            code: error.code
        });
    }
    // Handle other policy-related errors
    if (error.message?.includes("Access denied") ||
        error.message?.includes("Policy") ||
        error.message?.includes("Insufficient credits") ||
        error.message?.includes("Plan limit")) {
        return res.status(403).json({
            error: error.message,
            code: "POLICY_VIOLATION"
        });
    }
    next(error);
}
//# sourceMappingURL=policyIntegration.js.map