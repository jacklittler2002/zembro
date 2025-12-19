import { PrismaClient } from "@prisma/client";
import { BasePolicy, PolicyContext, PolicyResult } from "./basePolicies";
import {
  UserPolicy,
  LeadSearchPolicy,
  CreditPolicy,
  CampaignPolicy,
  ApiKeyPolicy,
  FileUploadPolicy,
  IntegrationPolicy
} from "./basePolicies";

/**
 * Policy Enforcer - Central system for enforcing all policies
 */
export class PolicyEnforcer {
  private policies: Map<string, BasePolicy> = new Map();
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.registerPolicies();
  }

  /**
   * Register all available policies
   */
  private registerPolicies() {
    this.register(new UserPolicy());
    this.register(new LeadSearchPolicy());
    this.register(new CreditPolicy());
    this.register(new CampaignPolicy());
    this.register(new ApiKeyPolicy());
    this.register(new FileUploadPolicy());
    this.register(new IntegrationPolicy());
  }

  /**
   * Register a policy
   */
  register(policy: BasePolicy) {
    this.policies.set(policy.name, policy);
  }

  /**
   * Get a policy by name
   */
  getPolicy(name: string): BasePolicy | undefined {
    return this.policies.get(name);
  }

  /**
   * Enforce a policy check
   */
  async enforce(
    policyName: string,
    context: Omit<PolicyContext, 'prisma'>
  ): Promise<PolicyResult> {
    const policy = this.getPolicy(policyName);
    if (!policy) {
      return { allowed: false, reason: `Policy '${policyName}' not found` };
    }

    const fullContext: PolicyContext = {
      ...context,
      prisma: this.prisma
    };

    return await policy.check(fullContext);
  }

  /**
   * Validate data using policy rules
   */
  async validateData(
    policyName: string,
    context: Omit<PolicyContext, 'prisma'>,
    data: any
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const policy = this.getPolicy(policyName);
    if (!policy?.validateData) {
      return { valid: true }; // No validation rules
    }

    const fullContext: PolicyContext = {
      ...context,
      prisma: this.prisma
    };

    return await policy.validateData(fullContext, data);
  }

  /**
   * Filter data using policy rules
   */
  async filterData(
    policyName: string,
    context: Omit<PolicyContext, 'prisma'>,
    data: any
  ): Promise<any> {
    const policy = this.getPolicy(policyName);
    if (!policy?.filterData) {
      return data; // No filtering rules
    }

    const fullContext: PolicyContext = {
      ...context,
      prisma: this.prisma
    };

    return await policy.filterData(fullContext, data);
  }

  /**
   * Check multiple policies at once
   */
  async enforceMultiple(
    checks: Array<{ policy: string; context: Omit<PolicyContext, 'prisma'> }>
  ): Promise<{ allowed: boolean; results: PolicyResult[] }> {
    const results: PolicyResult[] = [];

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

/**
 * Policy Middleware for Express routes
 */
export function createPolicyMiddleware(
  policyName: string,
  action: string,
  getResource?: (req: any) => any
) {
  return async (req: any, res: any, next: any) => {
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
    } catch (error: any) {
      console.error("Policy middleware error:", error);
      res.status(500).json({ error: "Policy enforcement failed" });
    }
  };
}

/**
 * Data Validation Middleware
 */
export function createValidationMiddleware(
  policyName: string,
  action: string = "create"
) {
  return async (req: any, res: any, next: any) => {
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
    } catch (error: any) {
      console.error("Validation middleware error:", error);
      res.status(500).json({ error: "Validation failed" });
    }
  };
}

/**
 * Global Policy Context Provider
 */
export class PolicyProvider {
  private static instance: PolicyProvider;
  private enforcer: PolicyEnforcer | null = null;

  static getInstance(): PolicyProvider {
    if (!PolicyProvider.instance) {
      PolicyProvider.instance = new PolicyProvider();
    }
    return PolicyProvider.instance;
  }

  setPrisma(prisma: PrismaClient) {
    this.enforcer = new PolicyEnforcer(prisma);
  }

  getEnforcer(): PolicyEnforcer {
    if (!this.enforcer) {
      throw new Error("Policy enforcer not initialized. Call setPrisma() first.");
    }
    return this.enforcer;
  }
}

/**
 * Helper function to get policy enforcer
 */
export function getPolicyEnforcer(): PolicyEnforcer {
  return PolicyProvider.getInstance().getEnforcer();
}

/**
 * Initialize policies with Prisma client
 */
export function initializePolicies(prisma: PrismaClient) {
  PolicyProvider.getInstance().setPrisma(prisma);
}