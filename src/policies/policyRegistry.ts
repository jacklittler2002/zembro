import { PolicyEnforcer, initializePolicies } from "./policyEnforcer";
import {
  UserPolicy,
  LeadSearchPolicy,
  CreditPolicy,
  CampaignPolicy,
  ApiKeyPolicy,
  FileUploadPolicy,
  IntegrationPolicy
} from "./basePolicies";
import {
  LeadPolicy,
  ListPolicy,
  CompanyPolicy,
  NotificationPolicy,
  AuditLogPolicy
} from "./dataPolicies";

/**
 * Master Policy Registry - All policies in one place
 */
export class PolicyRegistry {
  private static enforcer: PolicyEnforcer | null = null;

  /**
   * Initialize all policies with Prisma client
   */
  static initialize(prisma: any) {
    initializePolicies(prisma);
    this.enforcer = new PolicyEnforcer(prisma);

    // Register all policies
    this.enforcer.register(new UserPolicy());
    this.enforcer.register(new LeadSearchPolicy());
    this.enforcer.register(new CreditPolicy());
    this.enforcer.register(new CampaignPolicy());
    this.enforcer.register(new ApiKeyPolicy());
    this.enforcer.register(new FileUploadPolicy());
    this.enforcer.register(new IntegrationPolicy());
    this.enforcer.register(new LeadPolicy());
    this.enforcer.register(new ListPolicy());
    this.enforcer.register(new CompanyPolicy());
    this.enforcer.register(new NotificationPolicy());
    this.enforcer.register(new AuditLogPolicy());
  }

  /**
   * Get the policy enforcer instance
   */
  static getEnforcer(): PolicyEnforcer {
    if (!this.enforcer) {
      throw new Error("Policy registry not initialized. Call PolicyRegistry.initialize() first.");
    }
    return this.enforcer;
  }

  /**
   * Quick policy check
   */
  static async check(
    policy: string,
    userId: string,
    action: string,
    resource?: any
  ): Promise<boolean> {
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
  static async validate(
    policy: string,
    userId: string,
    action: string,
    data: any
  ): Promise<{ valid: boolean; errors?: string[] }> {
    return await this.getEnforcer().validateData(policy, {
      userId,
      action,
      resource: data
    }, data);
  }

  /**
   * Quick data filtering
   */
  static async filter(
    policy: string,
    userId: string,
    action: string,
    data: any
  ): Promise<any> {
    return await this.getEnforcer().filterData(policy, {
      userId,
      action,
      resource: data
    }, data);
  }
}

/**
 * Policy Guard Functions - Easy-to-use policy checks
 */
export class PolicyGuard {
  /**
   * Check if user can perform action on resource
   */
  static async can(
    userId: string,
    action: string,
    resource: string,
    resourceData?: any
  ): Promise<boolean> {
    return await PolicyRegistry.check(resource, userId, action, resourceData);
  }

  /**
   * Check if user can create a resource
   */
  static async canCreate(userId: string, resource: string, data?: any): Promise<boolean> {
    return await this.can(userId, "create", resource, data);
  }

  /**
   * Check if user can read a resource
   */
  static async canRead(userId: string, resource: string, resourceData?: any): Promise<boolean> {
    return await this.can(userId, "read", resource, resourceData);
  }

  /**
   * Check if user can update a resource
   */
  static async canUpdate(userId: string, resource: string, resourceData?: any): Promise<boolean> {
    return await this.can(userId, "update", resource, resourceData);
  }

  /**
   * Check if user can delete a resource
   */
  static async canDelete(userId: string, resource: string, resourceData?: any): Promise<boolean> {
    return await this.can(userId, "delete", resource, resourceData);
  }

  /**
   * Validate data for a resource
   */
  static async validateData(
    userId: string,
    resource: string,
    action: string,
    data: any
  ): Promise<{ valid: boolean; errors?: string[] }> {
    return await PolicyRegistry.validate(resource, userId, action, data);
  }

  /**
   * Filter data based on user permissions
   */
  static async filterData(
    userId: string,
    resource: string,
    action: string,
    data: any
  ): Promise<any> {
    return await PolicyRegistry.filter(resource, userId, action, data);
  }

  /**
   * Enforce policy or throw error
   */
  static async enforce(
    userId: string,
    action: string,
    resource: string,
    resourceData?: any,
    errorMessage?: string
  ): Promise<void> {
    const allowed = await this.can(userId, action, resource, resourceData);
    if (!allowed) {
      throw new Error(errorMessage || `Access denied: cannot ${action} ${resource}`);
    }
  }

  /**
   * Validate data or throw error
   */
  static async enforceValidation(
    userId: string,
    resource: string,
    action: string,
    data: any,
    errorMessage?: string
  ): Promise<void> {
    const validation = await this.validateData(userId, resource, action, data);
    if (!validation.valid) {
      throw new Error(errorMessage || `Validation failed: ${validation.errors?.join(', ')}`);
    }
  }
}

/**
 * Business Rule Policies - Domain-specific rules
 */
export class BusinessRules {
  /**
   * Check if user has sufficient credits for operation
   */
  static async checkCreditBalance(
    userId: string,
    requiredCredits: number,
    operation: string
  ): Promise<{ sufficient: boolean; currentBalance: number }> {
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
  static async checkPlanLimits(
    userId: string,
    operation: string,
    params?: any
  ): Promise<{ allowed: boolean; limit?: number; current?: number }> {
    const enforcer = PolicyRegistry.getEnforcer();

    let policyName: string;
    let action: string;

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
  static async checkFileUpload(
    userId: string,
    file: { size: number; type: string; name: string }
  ): Promise<{ allowed: boolean; reason?: string }> {
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
  static async validateLeadSearch(
    userId: string,
    searchData: {
      query: string;
      maxLeads?: number;
      filters?: any;
    }
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

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

  private static extractLimitFromReason(reason?: string): number | undefined {
    if (!reason) return undefined;
    const match = reason.match(/(\d+)/);
    return match && match[1] ? parseInt(match[1], 10) : undefined;
  }

  private static async getCurrentUsage(
    userId: string,
    operation: string,
    prisma: any
  ): Promise<number | undefined> {
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

/**
 * Security Policies - Additional security checks
 */
export class SecurityPolicies {
  /**
   * Rate limiting check
   */
  static async checkRateLimit(
    userId: string,
    operation: string,
    windowMinutes: number = 60,
    maxRequests: number = 100
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
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
  static async checkSuspiciousActivity(
    _userId: string,
    _action: string,
    _data?: any
  ): Promise<{ suspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];

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
  static sanitizeInput(data: any): any {
    if (typeof data === "string") {
      // Remove potentially dangerous characters
      return data.replace(/[<>'"&]/g, "");
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }

    if (typeof data === "object" && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return data;
  }
}