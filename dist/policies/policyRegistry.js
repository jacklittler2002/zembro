"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityPolicies = exports.BusinessRules = exports.PolicyGuard = exports.PolicyRegistry = void 0;
const policyEnforcer_1 = require("./policyEnforcer");
const basePolicies_1 = require("./basePolicies");
const dataPolicies_1 = require("./dataPolicies");
/**
 * Master Policy Registry - All policies in one place
 */
class PolicyRegistry {
    static enforcer = null;
    /**
     * Initialize all policies with Prisma client
     */
    static initialize(prisma) {
        (0, policyEnforcer_1.initializePolicies)(prisma);
        this.enforcer = new policyEnforcer_1.PolicyEnforcer(prisma);
        // Register all policies
        this.enforcer.register(new basePolicies_1.UserPolicy());
        this.enforcer.register(new basePolicies_1.LeadSearchPolicy());
        this.enforcer.register(new basePolicies_1.CreditPolicy());
        this.enforcer.register(new basePolicies_1.CampaignPolicy());
        this.enforcer.register(new basePolicies_1.ApiKeyPolicy());
        this.enforcer.register(new basePolicies_1.FileUploadPolicy());
        this.enforcer.register(new basePolicies_1.IntegrationPolicy());
        this.enforcer.register(new dataPolicies_1.LeadPolicy());
        this.enforcer.register(new dataPolicies_1.ListPolicy());
        this.enforcer.register(new dataPolicies_1.CompanyPolicy());
        this.enforcer.register(new dataPolicies_1.NotificationPolicy());
        this.enforcer.register(new dataPolicies_1.AuditLogPolicy());
    }
    /**
     * Get the policy enforcer instance
     */
    static getEnforcer() {
        if (!this.enforcer) {
            throw new Error("Policy registry not initialized. Call PolicyRegistry.initialize() first.");
        }
        return this.enforcer;
    }
    /**
     * Quick policy check
     */
    static async check(policy, userId, action, resource) {
        const result = await this.getEnforcer().enforce(policy, {
            userId,
            action,
            resource
        });
        return result.allowed;
    }
    /**
     * Quick data validation
     */
    static async validate(policy, userId, action, data) {
        return await this.getEnforcer().validateData(policy, {
            userId,
            action,
            resource: data
        }, data);
    }
    /**
     * Quick data filtering
     */
    static async filter(policy, userId, action, data) {
        return await this.getEnforcer().filterData(policy, {
            userId,
            action,
            resource: data
        }, data);
    }
}
exports.PolicyRegistry = PolicyRegistry;
/**
 * Policy Guard Functions - Easy-to-use policy checks
 */
class PolicyGuard {
    /**
     * Check if user can perform action on resource
     */
    static async can(userId, action, resource, resourceData) {
        return await PolicyRegistry.check(resource, userId, action, resourceData);
    }
    /**
     * Check if user can create a resource
     */
    static async canCreate(userId, resource, data) {
        return await this.can(userId, "create", resource, data);
    }
    /**
     * Check if user can read a resource
     */
    static async canRead(userId, resource, resourceData) {
        return await this.can(userId, "read", resource, resourceData);
    }
    /**
     * Check if user can update a resource
     */
    static async canUpdate(userId, resource, resourceData) {
        return await this.can(userId, "update", resource, resourceData);
    }
    /**
     * Check if user can delete a resource
     */
    static async canDelete(userId, resource, resourceData) {
        return await this.can(userId, "delete", resource, resourceData);
    }
    /**
     * Validate data for a resource
     */
    static async validateData(userId, resource, action, data) {
        return await PolicyRegistry.validate(resource, userId, action, data);
    }
    /**
     * Filter data based on user permissions
     */
    static async filterData(userId, resource, action, data) {
        return await PolicyRegistry.filter(resource, userId, action, data);
    }
    /**
     * Enforce policy or throw error
     */
    static async enforce(userId, action, resource, resourceData, errorMessage) {
        const allowed = await this.can(userId, action, resource, resourceData);
        if (!allowed) {
            throw new Error(errorMessage || `Access denied: cannot ${action} ${resource}`);
        }
    }
    /**
     * Validate data or throw error
     */
    static async enforceValidation(userId, resource, action, data, errorMessage) {
        const validation = await this.validateData(userId, resource, action, data);
        if (!validation.valid) {
            throw new Error(errorMessage || `Validation failed: ${validation.errors?.join(', ')}`);
        }
    }
}
exports.PolicyGuard = PolicyGuard;
/**
 * Business Rule Policies - Domain-specific rules
 */
class BusinessRules {
    /**
     * Check if user has sufficient credits for operation
     */
    static async checkCreditBalance(userId, requiredCredits, operation) {
        const enforcer = PolicyRegistry.getEnforcer();
        const result = await enforcer.enforce("credit", {
            userId,
            action: "spend",
            resource: { cost: requiredCredits, operation }
        });
        // Get current balance
        const wallet = await enforcer["prisma"].aiCreditWallet.findUnique({
            where: { userId }
        });
        return {
            sufficient: result.allowed,
            currentBalance: wallet?.balance || 0
        };
    }
    /**
     * Check plan limits for operation
     */
    static async checkPlanLimits(userId, operation, params) {
        const enforcer = PolicyRegistry.getEnforcer();
        let policyName;
        let action;
        switch (operation) {
            case "lead_search":
                policyName = "leadSearch";
                action = "create";
                break;
            case "campaign":
                policyName = "campaign";
                action = "create";
                break;
            case "api_key":
                policyName = "apiKey";
                action = "create";
                break;
            default:
                return { allowed: true };
        }
        const result = await enforcer.enforce(policyName, {
            userId,
            action,
            resource: params
        });
        const limit = this.extractLimitFromReason(result.reason);
        const current = await this.getCurrentUsage(userId, operation, enforcer["prisma"]);
        return {
            allowed: result.allowed,
            ...(limit !== undefined && { limit }),
            ...(current !== undefined && { current })
        };
    }
    /**
     * Check file upload constraints
     */
    static async checkFileUpload(userId, file) {
        const enforcer = PolicyRegistry.getEnforcer();
        const result = await enforcer.enforce("fileUpload", {
            userId,
            action: "upload",
            resource: {
                size: file.size,
                mimeType: file.type,
                filename: file.name
            }
        });
        return {
            allowed: result.allowed,
            ...(result.reason && { reason: result.reason })
        };
    }
    /**
     * Validate business rules for lead search
     */
    static async validateLeadSearch(userId, searchData) {
        const errors = [];
        // Check query complexity
        if (searchData.query.length < 3) {
            errors.push("Search query too short");
        }
        if (searchData.query.length > 200) {
            errors.push("Search query too long");
        }
        // Check lead limits
        if (searchData.maxLeads && searchData.maxLeads > 1000) {
            errors.push("Maximum leads per search is 1000");
        }
        // Use policy validation
        const validation = await PolicyRegistry.validate("leadSearch", userId, "create", searchData);
        if (!validation.valid && validation.errors) {
            errors.push(...validation.errors);
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    static extractLimitFromReason(reason) {
        if (!reason)
            return undefined;
        const match = reason.match(/(\d+)/);
        return match && match[1] ? parseInt(match[1], 10) : undefined;
    }
    static async getCurrentUsage(userId, operation, prisma) {
        switch (operation) {
            case "lead_search":
                return await prisma.leadSearch.count({
                    where: {
                        userId,
                        status: { in: ["PENDING", "RUNNING"] }
                    }
                });
            case "campaign":
                return await prisma.campaign.count({
                    where: { userId }
                });
            case "api_key":
                return await prisma.apiKey.count({
                    where: { userId, isActive: true }
                });
            default:
                return undefined;
        }
    }
}
exports.BusinessRules = BusinessRules;
/**
 * Security Policies - Additional security checks
 */
class SecurityPolicies {
    /**
     * Rate limiting check
     */
    static async checkRateLimit(userId, operation, windowMinutes = 60, maxRequests = 100) {
        // This would integrate with Redis or similar for rate limiting
        // For now, return mock data
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetTime: new Date(Date.now() + windowMinutes * 60 * 1000)
        };
    }
    /**
     * Check for suspicious activity
     */
    static async checkSuspiciousActivity(_userId, _action, _data) {
        const reasons = [];
        // Check for rapid successive operations
        // Check for unusual data patterns
        // Check for blacklisted terms
        return {
            suspicious: reasons.length > 0,
            reasons
        };
    }
    /**
     * Data sanitization
     */
    static sanitizeInput(data) {
        if (typeof data === "string") {
            // Remove potentially dangerous characters
            return data.replace(/[<>'"&]/g, "");
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeInput(item));
        }
        if (typeof data === "object" && data !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        return data;
    }
}
exports.SecurityPolicies = SecurityPolicies;
//# sourceMappingURL=policyRegistry.js.map