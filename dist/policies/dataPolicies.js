"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogPolicy = exports.NotificationPolicy = exports.CompanyPolicy = exports.ListPolicy = exports.LeadPolicy = void 0;
const basePolicies_1 = require("./basePolicies");
/**
 * Lead Policy - Controls lead/contact operations
 */
class LeadPolicy extends basePolicies_1.BasePolicy {
    name = "lead";
    async check(context) {
        const { userId, action, resource, prisma } = context;
        switch (action) {
            case "read": {
                // Users can read leads from their lead searches or favorited companies
                if (resource?.company) {
                    const hasAccess = await this.checkCompanyAccess(userId, resource.company.id, prisma);
                    if (!hasAccess) {
                        return { allowed: false, reason: "No access to this lead's company" };
                    }
                }
                return { allowed: true };
            }
            case "update":
            case "delete": {
                // Users can only modify leads from their own lead searches
                if (resource?.company) {
                    const hasOwnership = await this.checkCompanyOwnership(userId, resource.company.id, prisma);
                    if (!hasOwnership) {
                        return { allowed: false, reason: "Can only modify leads from your own searches" };
                    }
                }
                return { allowed: true };
            }
            case "export": {
                // Check export limits and ownership
                const exportCount = await this.getRecentExportCount(userId, prisma);
                if (exportCount >= 10) { // Max 10 exports per hour
                    return { allowed: false, reason: "Export limit exceeded. Try again later." };
                }
                return { allowed: true };
            }
            default:
                return { allowed: false, reason: "Unknown action" };
        }
    }
    async filterData(context, data) {
        // Filter out sensitive information based on user permissions
        if (Array.isArray(data)) {
            return data.map(lead => this.filterLeadData(lead, context));
        }
        return this.filterLeadData(data, context);
    }
    filterLeadData(lead, _context) {
        // Remove internal fields that users shouldn't see
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, updatedAt, ...filtered } = lead;
        return filtered;
    }
    async checkCompanyAccess(userId, companyId, prisma) {
        // Check if user has access to this company through their lead searches
        const leadSearch = await prisma.leadSearch.findFirst({
            where: {
                userId,
                companies: {
                    some: { id: companyId }
                }
            }
        });
        if (leadSearch)
            return true;
        // Check if company is favorited by user
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });
        return company?.isFavorited === true;
    }
    async checkCompanyOwnership(userId, companyId, prisma) {
        // Check if user owns the lead search that discovered this company
        const leadSearch = await prisma.leadSearch.findFirst({
            where: {
                userId,
                companies: {
                    some: { id: companyId }
                }
            }
        });
        return !!leadSearch;
    }
    async getRecentExportCount(userId, prisma) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return await prisma.leadExport.count({
            where: {
                userId,
                exportedAt: {
                    gte: oneHourAgo
                }
            }
        });
    }
}
exports.LeadPolicy = LeadPolicy;
/**
 * List Policy - Controls lead list operations
 */
class ListPolicy extends basePolicies_1.BasePolicy {
    name = "list";
    async check(context) {
        const { userId, action, resource, prisma } = context;
        switch (action) {
            case "create": {
                // Check list limits
                const listCount = await prisma.list.count({
                    where: { userId }
                });
                if (listCount >= 50) { // Max 50 lists per user
                    return { allowed: false, reason: "Maximum of 50 lists allowed" };
                }
                return { allowed: true };
            }
            case "read":
            case "update":
            case "delete": {
                // Users can only access their own lists
                if (resource?.userId !== userId) {
                    return { allowed: false, reason: "Access denied to this list" };
                }
                return { allowed: true };
            }
            case "share":
                // Check if sharing is allowed (could be based on plan)
                return { allowed: true }; // Allow sharing for now
            default:
                return { allowed: false, reason: "Unknown action" };
        }
    }
    async validateData(context, data) {
        const errors = [];
        if (!data.name || data.name.trim().length < 1) {
            errors.push("List name is required");
        }
        if (data.name && data.name.length > 100) {
            errors.push("List name must be less than 100 characters");
        }
        if (data.description && data.description.length > 500) {
            errors.push("Description must be less than 500 characters");
        }
        return {
            valid: errors.length === 0,
            ...(errors.length > 0 && { errors })
        };
    }
}
exports.ListPolicy = ListPolicy;
/**
 * Company Policy - Controls company operations
 */
class CompanyPolicy extends basePolicies_1.BasePolicy {
    name = "company";
    async check(context) {
        const { userId, action, resource, prisma } = context;
        switch (action) {
            case "read": {
                // Users can read companies from their searches or favorited ones
                const hasAccess = await this.checkCompanyAccess(userId, resource?.id, prisma);
                if (!hasAccess) {
                    return { allowed: false, reason: "No access to this company" };
                }
                return { allowed: true };
            }
            case "update": {
                // Users can only update companies from their own searches
                const hasOwnership = await this.checkCompanyOwnership(userId, resource?.id, prisma);
                if (!hasOwnership) {
                    return { allowed: false, reason: "Can only update companies from your searches" };
                }
                return { allowed: true };
            }
            case "favorite":
            case "unfavorite": {
                // Anyone with read access can favorite/unfavorite
                const canRead = await this.checkCompanyAccess(userId, resource?.id, prisma);
                if (!canRead) {
                    return { allowed: false, reason: "Cannot favorite inaccessible company" };
                }
                return { allowed: true };
            }
            default:
                return { allowed: false, reason: "Unknown action" };
        }
    }
    async checkCompanyAccess(userId, companyId, prisma) {
        if (!companyId)
            return false;
        // Check lead search access
        const leadSearch = await prisma.leadSearch.findFirst({
            where: {
                userId,
                companies: {
                    some: { id: companyId }
                }
            }
        });
        if (leadSearch)
            return true;
        // Check if favorited
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });
        return company?.isFavorited === true;
    }
    async checkCompanyOwnership(userId, companyId, prisma) {
        if (!companyId)
            return false;
        const leadSearch = await prisma.leadSearch.findFirst({
            where: {
                userId,
                companies: {
                    some: { id: companyId }
                }
            }
        });
        return !!leadSearch;
    }
}
exports.CompanyPolicy = CompanyPolicy;
/**
 * Notification Policy - Controls notification operations
 */
class NotificationPolicy extends basePolicies_1.BasePolicy {
    name = "notification";
    async check(context) {
        const { userId, action, resource } = context;
        switch (action) {
            case "read":
            case "update":
            case "delete":
                // Users can only access their own notifications
                if (resource?.userId !== userId) {
                    return { allowed: false, reason: "Access denied to this notification" };
                }
                return { allowed: true };
            case "mark_read":
            case "mark_unread":
                // Bulk operations allowed for own notifications
                return { allowed: true };
            default:
                return { allowed: false, reason: "Unknown action" };
        }
    }
    async filterData(context, data) {
        // Ensure users only see their own notifications
        if (Array.isArray(data)) {
            return data.filter(notification => notification.userId === context.userId);
        }
        return data.userId === context.userId ? data : null;
    }
}
exports.NotificationPolicy = NotificationPolicy;
/**
 * Audit Log Policy - Controls audit log access
 */
class AuditLogPolicy extends basePolicies_1.BasePolicy {
    name = "auditLog";
    async check(context) {
        const { userId, action, resource } = context;
        switch (action) {
            case "read": {
                // Users can only see their own audit logs
                // Admins could see all logs (future enhancement)
                if (resource?.userId && resource.userId !== userId) {
                    return { allowed: false, reason: "Can only view own audit logs" };
                }
                return { allowed: true };
            }
            default:
                return { allowed: false, reason: "Audit logs are read-only" };
        }
    }
    async filterData(context, data) {
        // Filter to only show user's own logs or public logs
        if (Array.isArray(data)) {
            return data.filter(log => !log.userId || log.userId === context.userId);
        }
        return (!data.userId || data.userId === context.userId) ? data : null;
    }
}
exports.AuditLogPolicy = AuditLogPolicy;
//# sourceMappingURL=dataPolicies.js.map