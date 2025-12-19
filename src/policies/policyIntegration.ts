import { PolicyRegistry, PolicyGuard, BusinessRules } from "../policies/policyRegistry";
import { PolicyMiddleware } from "../policies/policyMiddleware";
import { prisma } from "../db";
import { randomBytes } from "crypto";

/**
 * Policy Integration Service
 *
 * This service provides easy integration of policies into existing services
 */
export class PolicyIntegration {
  /**
   * Initialize all policies - call this once at app startup
   */
  static initialize() {
    PolicyRegistry.initialize(prisma);
    console.log("✅ Policy system initialized");
  }

  /**
   * Enhanced service methods with policy checks
   */
  static async withPolicy<T>(
    userId: string,
    action: string,
    resource: string,
    operation: () => Promise<T>,
    resourceData?: any
  ): Promise<T> {
    // Check policy
    await PolicyGuard.enforce(userId, action, resource, resourceData);

    // Execute operation
    return await operation();
  }

  /**
   * Enhanced service methods with validation
   */
  static async withValidation<T>(
    userId: string,
    resource: string,
    action: string,
    data: any,
    operation: () => Promise<T>
  ): Promise<T> {
    // Validate data
    await PolicyGuard.enforceValidation(userId, resource, action, data);

    // Execute operation
    return await operation();
  }

  /**
   * Enhanced service methods with both policy and validation
   */
  static async withPolicyAndValidation<T>(
    userId: string,
    action: string,
    resource: string,
    data: any,
    operation: () => Promise<T>
  ): Promise<T> {
    // Check policy
    await PolicyGuard.enforce(userId, action, resource, data);

    // Validate data
    await PolicyGuard.enforceValidation(userId, resource, action, data);

    // Execute operation
    return await operation();
  }
}

/**
 * Policy-Aware Service Base Class
 *
 * Extend this class to create services with built-in policy enforcement
 */
export abstract class PolicyAwareService {
  protected async enforce(
    userId: string,
    action: string,
    resource: string,
    resourceData?: any
  ): Promise<void> {
    await PolicyGuard.enforce(userId, action, resource, resourceData);
  }

  protected async validate(
    userId: string,
    resource: string,
    action: string,
    data: any
  ): Promise<void> {
    await PolicyGuard.enforceValidation(userId, resource, action, data);
  }

  protected async filter(
    userId: string,
    resource: string,
    action: string,
    data: any
  ): Promise<any> {
    return await PolicyGuard.filterData(userId, resource, action, data);
  }

  protected async checkCredits(
    userId: string,
    requiredCredits: number,
    operation: string
  ): Promise<void> {
    const creditCheck = await BusinessRules.checkCreditBalance(userId, requiredCredits, operation);
    if (!creditCheck.sufficient) {
      throw new Error(`Insufficient credits: ${creditCheck.currentBalance} available, ${requiredCredits} required`);
    }
  }

  protected async checkPlanLimits(
    userId: string,
    operation: string,
    params?: any
  ): Promise<void> {
    const limitCheck = await BusinessRules.checkPlanLimits(userId, operation, params);
    if (!limitCheck.allowed) {
      throw new Error(`Plan limit exceeded for ${operation}`);
    }
  }
}

/**
 * Examples of how to integrate policies into existing services
 */

// Example: Enhanced Lead Search Service
export class EnhancedLeadSearchService extends PolicyAwareService {
  async createLeadSearch(userId: string, input: any) {
    // Check permissions
    await this.enforce(userId, "create", "leadSearch");

    // Validate data
    await this.validate(userId, "leadSearch", "create", input);

    // Check that user has some credits available (soft check for Instantly-style)
    const wallet = await prisma.aiCreditWallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balance <= 0) {
      throw new Error("Insufficient credits to start lead search. At least 1 credit required.");
    }

    // Proceed with creation (no upfront credit charge)
    const leadSearch = await prisma.leadSearch.create({
      data: {
        userId,
        ...input
      }
    });

    return leadSearch;
  }

  async getLeadSearch(userId: string, searchId: string) {
    // Check permissions
    await this.enforce(userId, "read", "leadSearch", { id: searchId });

    // Get and filter data
    const search = await prisma.leadSearch.findUnique({
      where: { id: searchId },
      include: { companies: true }
    });

    return await this.filter(userId, "leadSearch", "read", search);
  }
}

// Example: Enhanced Campaign Service
export class EnhancedCampaignService extends PolicyAwareService {
  async createCampaign(userId: string, input: any) {
    // Check permissions
    await this.enforce(userId, "create", "campaign");

    // Validate data
    await this.validate(userId, "campaign", "create", input);

    // Check plan limits
    await this.checkPlanLimits(userId, "campaign");

    // Verify email accounts exist
    const emailAccounts = await prisma.emailAccount.count({
      where: { userId, status: "ACTIVE" }
    });

    if (emailAccounts === 0) {
      throw new Error("At least one verified email account required");
    }

    // Proceed with creation
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        ...input
      }
    });

    return campaign;
  }
}

// Example: Enhanced API Key Service
export class EnhancedApiKeyService extends PolicyAwareService {
  async createApiKey(userId: string, input: any) {
    // Check permissions
    await this.enforce(userId, "create", "apiKey");

    // Validate data
    await this.validate(userId, "apiKey", "create", input);

    // Check plan limits
    await this.checkPlanLimits(userId, "api_key");

    // Generate secure key
    const key = this.generateApiKey();

    // Create key
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: input.name,
        key,
        permissions: input.permissions || []
      }
    });

    return apiKey;
  }

  private generateApiKey(): string {
    return "zk_" + randomBytes(32).toString("hex");
  }
}

/**
 * Route Integration Examples
 *
 * These show how to integrate policies into Express routes
 */
export const policyRouteExamples = {
  // Lead search routes with policies
  leadSearchRoutes: (app: any) => {
    app.post("/api/lead-searches",
      PolicyMiddleware.attachEnforcer,
      PolicyMiddleware.check("leadSearch", "create"),
      PolicyMiddleware.validate("leadSearch"),
      PolicyMiddleware.businessRules("lead_search"),
      PolicyMiddleware.checkCredits(25, "lead_search"),
      async (req: any, res: any) => {
        try {
          const service = new EnhancedLeadSearchService();
          const result = await service.createLeadSearch(req.userId, req.body);
          res.json(result);
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    app.get("/api/lead-searches/:id",
      PolicyMiddleware.attachEnforcer,
      PolicyMiddleware.check("leadSearch", "read", (req) => ({ id: req.params.id })),
      PolicyMiddleware.filter("leadSearch"),
      async (req: any, res: any) => {
        try {
          const service = new EnhancedLeadSearchService();
          const result = await service.getLeadSearch(req.userId, req.params.id);
          res.json(result);
        } catch (error: any) {
          res.status(404).json({ error: error.message });
        }
      }
    );
  },

  // Campaign routes with policies
  campaignRoutes: (app: any) => {
    app.post("/api/campaigns",
      PolicyMiddleware.attachEnforcer,
      PolicyMiddleware.check("campaign", "create"),
      PolicyMiddleware.validate("campaign"),
      PolicyMiddleware.businessRules("campaign"),
      async (req: any, res: any) => {
        try {
          const service = new EnhancedCampaignService();
          const result = await service.createCampaign(req.userId, req.body);
          res.json(result);
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );
  },

  // API key routes with policies
  apiKeyRoutes: (app: any) => {
    app.post("/api/api-keys",
      PolicyMiddleware.attachEnforcer,
      PolicyMiddleware.check("apiKey", "create"),
      PolicyMiddleware.validate("apiKey"),
      PolicyMiddleware.businessRules("api_key"),
      async (req: any, res: any) => {
        try {
          const service = new EnhancedApiKeyService();
          const result = await service.createApiKey(req.userId, req.body);
          res.json(result);
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );
  }
};

/**
 * Error Handling for Policy Violations
 */
export class PolicyError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = "PolicyError";
  }
}

/**
 * Policy Error Handler Middleware
 */
export function policyErrorHandler(
  error: any,
  req: any,
  res: any,
  next: any
) {
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