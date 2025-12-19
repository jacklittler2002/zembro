"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyProvider = exports.PolicyEnforcer = void 0;
exports.createPolicyMiddleware = createPolicyMiddleware;
exports.createValidationMiddleware = createValidationMiddleware;
exports.getPolicyEnforcer = getPolicyEnforcer;
exports.initializePolicies = initializePolicies;
const basePolicies_1 = require("./basePolicies");
/**
 * Policy Enforcer - Central system for enforcing all policies
 */
class PolicyEnforcer {
    policies = new Map();
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
        this.registerPolicies();
    }
    /**
     * Register all available policies
     */
    registerPolicies() {
        this.register(new basePolicies_1.UserPolicy());
        this.register(new basePolicies_1.LeadSearchPolicy());
        this.register(new basePolicies_1.CreditPolicy());
        this.register(new basePolicies_1.CampaignPolicy());
        this.register(new basePolicies_1.ApiKeyPolicy());
        this.register(new basePolicies_1.FileUploadPolicy());
        this.register(new basePolicies_1.IntegrationPolicy());
    }
    /**
     * Register a policy
     */
    register(policy) {
        this.policies.set(policy.name, policy);
    }
    /**
     * Get a policy by name
     */
    getPolicy(name) {
        return this.policies.get(name);
    }
    /**
     * Enforce a policy check
     */
    async enforce(policyName, context) {
        const policy = this.getPolicy(policyName);
        if (!policy) {
            return { allowed: false, reason: `Policy '${policyName}' not found` };
        }
        const fullContext = {
            ...context,
            prisma: this.prisma
        };
        return await policy.check(fullContext);
    }
    /**
     * Validate data using policy rules
     */
    async validateData(policyName, context, data) {
        const policy = this.getPolicy(policyName);
        if (!policy?.validateData) {
            return { valid: true }; // No validation rules
        }
        const fullContext = {
            ...context,
            prisma: this.prisma
        };
        return await policy.validateData(fullContext, data);
    }
    /**
     * Filter data using policy rules
     */
    async filterData(policyName, context, data) {
        const policy = this.getPolicy(policyName);
        if (!policy?.filterData) {
            return data; // No filtering rules
        }
        const fullContext = {
            ...context,
            prisma: this.prisma
        };
        return await policy.filterData(fullContext, data);
    }
    /**
     * Check multiple policies at once
     */
    async enforceMultiple(checks) {
        const results = [];
        for (const check of checks) {
            const result = await this.enforce(check.policy, check.context);
            results.push(result);
            if (!result.allowed) {
                return { allowed: false, results };
            }
        }
        return { allowed: true, results };
    }
}
exports.PolicyEnforcer = PolicyEnforcer;
/**
 * Policy Middleware for Express routes
 */
function createPolicyMiddleware(policyName, action, getResource) {
    return async (req, res, next) => {
        try {
            const enforcer = req.policyEnforcer;
            if (!enforcer) {
                return res.status(500).json({ error: "Policy enforcer not available" });
            }
            const userId = req.userId || req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Authentication required" });
            }
            const resource = getResource ? getResource(req) : undefined;
            const result = await enforcer.enforce(policyName, {
                userId,
                action,
                resource
            });
            if (!result.allowed) {
                return res.status(result.reason?.includes('limit') ? 429 : 403)
                    .json({ error: result.reason || "Access denied" });
            }
            // Attach policy result to request for further processing
            req.policyResult = result;
            next();
        }
        catch (error) {
            console.error("Policy middleware error:", error);
            res.status(500).json({ error: "Policy enforcement failed" });
        }
    };
}
/**
 * Data Validation Middleware
 */
function createValidationMiddleware(policyName, action = "create") {
    return async (req, res, next) => {
        try {
            const enforcer = req.policyEnforcer;
            if (!enforcer) {
                return next(); // Skip if no enforcer
            }
            const userId = req.userId || req.user?.id;
            if (!userId) {
                return next(); // Skip validation if no user
            }
            const validation = await enforcer.validateData(policyName, {
                userId,
                action,
                resource: req.body
            }, req.body);
            if (!validation.valid) {
                return res.status(400).json({
                    error: "Validation failed",
                    details: validation.errors
                });
            }
            next();
        }
        catch (error) {
            console.error("Validation middleware error:", error);
            res.status(500).json({ error: "Validation failed" });
        }
    };
}
/**
 * Global Policy Context Provider
 */
class PolicyProvider {
    static instance;
    enforcer = null;
    static getInstance() {
        if (!PolicyProvider.instance) {
            PolicyProvider.instance = new PolicyProvider();
        }
        return PolicyProvider.instance;
    }
    setPrisma(prisma) {
        this.enforcer = new PolicyEnforcer(prisma);
    }
    getEnforcer() {
        if (!this.enforcer) {
            throw new Error("Policy enforcer not initialized. Call setPrisma() first.");
        }
        return this.enforcer;
    }
}
exports.PolicyProvider = PolicyProvider;
/**
 * Helper function to get policy enforcer
 */
function getPolicyEnforcer() {
    return PolicyProvider.getInstance().getEnforcer();
}
/**
 * Initialize policies with Prisma client
 */
function initializePolicies(prisma) {
    PolicyProvider.getInstance().setPrisma(prisma);
}
//# sourceMappingURL=policyEnforcer.js.map