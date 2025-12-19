import { User, PrismaClient } from "@prisma/client";

export interface PolicyContext {
  userId: string;
  user?: User;
  prisma: PrismaClient;
  resource?: any;
  action: string;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  data?: any;
}

/**
 * Base Policy class that all policies extend
 */
export abstract class BasePolicy {
  abstract name: string;

  /**
   * Check if the action is allowed
   */
  abstract check(context: PolicyContext): Promise<PolicyResult>;

  /**
   * Filter data based on policy rules
   */
  filterData?(context: PolicyContext, data: any): Promise<any>;

  /**
   * Validate data before operations
   */
  validateData?(context: PolicyContext, data: any): Promise<{ valid: boolean; errors?: string[] }>;
}

/**
 * User Policy - Controls user-related operations
 */
export class UserPolicy extends BasePolicy {
  name = "user";

  async check(context: PolicyContext): Promise<PolicyResult> {
    const { userId, action, resource } = context;

    switch (action) {
      case "read":
      case "update":
        // Users can only access their own data
        if (resource?.id !== userId) {
          return { allowed: false, reason: "Users can only access their own data" };
        }
        return { allowed: true };

      case "delete":
        // Users cannot delete themselves
        return { allowed: false, reason: "Users cannot delete their own accounts" };

      default:
        return { allowed: false, reason: "Unknown action" };
    }
  }

  async validateData(context: PolicyContext, data: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (data.email && !data.email.includes("@")) {
      errors.push("Invalid email format");
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors })
    };
  }
}

/**
 * Lead Search Policy - Controls lead search operations
 */
export class LeadSearchPolicy extends BasePolicy {
  name = "leadSearch";

  async check(context: PolicyContext): Promise<PolicyResult> {
    const { userId, action, resource, prisma } = context;

    switch (action) {
      case "create": {
        // Check plan limits
        const activeSearches = await prisma.leadSearch.count({
          where: {
            userId,
            status: { in: ["PENDING", "RUNNING"] }
          }
        });

        const planLimits = await this.getUserPlanLimits(userId, prisma);
        if (activeSearches >= planLimits.maxActiveSearches) {
          return {
            allowed: false,
            reason: `Maximum active searches (${planLimits.maxActiveSearches}) reached`
          };
        }
        return { allowed: true };
      }

      case "read":
      case "update":
      case "delete":
        // Users can only access their own lead searches
        if (resource?.userId !== userId) {
          return { allowed: false, reason: "Access denied to this lead search" };
        }
        return { allowed: true };

      default:
        return { allowed: false, reason: "Unknown action" };
    }
  }

  async validateData(context: PolicyContext, data: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!data.query || data.query.trim().length < 3) {
      errors.push("Search query must be at least 3 characters");
    }

    if (data.maxLeads && (data.maxLeads < 1 || data.maxLeads > 1000)) {
      errors.push("Max leads must be between 1 and 1000");
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors })
    };
  }

  private async getUserPlanLimits(_userId: string, _prisma: PrismaClient) {
    // This would integrate with your billing system
    // For now, return default limits
    return {
      maxActiveSearches: 5,
      maxLeadsPerSearch: 100
    };
  }
}

/**
 * Credit Policy - Controls credit usage and limits
 */
export class CreditPolicy extends BasePolicy {
  name = "credit";

  async check(context: PolicyContext): Promise<PolicyResult> {
    const { userId, action, resource, prisma } = context;

    switch (action) {
      case "spend": {
        const wallet = await prisma.aiCreditWallet.findUnique({
          where: { userId }
        });

        if (!wallet) {
          return { allowed: false, reason: "No credit wallet found" };
        }

        const cost = resource?.cost || 0;
        if (wallet.balance < cost) {
          return {
            allowed: false,
            reason: `Insufficient credits. Required: ${cost}, Available: ${wallet.balance}`
          };
        }

        return { allowed: true };
      }

      case "read": {
        // Users can only see their own credit data
        if (resource?.userId !== userId) {
          return { allowed: false, reason: "Access denied to credit data" };
        }
        return { allowed: true };
      }

      default:
        return { allowed: false, reason: "Unknown action" };
    }
  }
}

/**
 * Campaign Policy - Controls email campaign operations
 */
export class CampaignPolicy extends BasePolicy {
  name = "campaign";

  async check(context: PolicyContext): Promise<PolicyResult> {
    const { userId, action, resource, prisma } = context;

    switch (action) {
      case "create": {
        // Check if user has verified email accounts
        const emailAccounts = await prisma.emailAccount.count({
          where: {
            userId,
            status: "ACTIVE"
          }
        });

        if (emailAccounts === 0) {
          return {
            allowed: false,
            reason: "At least one verified email account required to create campaigns"
          };
        }
        return { allowed: true };
      }

      case "read":
      case "update":
      case "delete":
        // Users can only access their own campaigns
        if (resource?.userId !== userId) {
          return { allowed: false, reason: "Access denied to this campaign" };
        }
        return { allowed: true };

      case "send":
        // Additional checks for sending campaigns
        if (resource?.status !== "SCHEDULED") {
          return { allowed: false, reason: "Campaign must be scheduled to send" };
        }
        return { allowed: true };

      default:
        return { allowed: false, reason: "Unknown action" };
    }
  }

  async validateData(context: PolicyContext, data: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 1) {
      errors.push("Campaign name is required");
    }

    if (data.dailyLimit && (data.dailyLimit < 1 || data.dailyLimit > 1000)) {
      errors.push("Daily limit must be between 1 and 1000");
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors })
    };
  }
}

/**
 * API Key Policy - Controls API key operations
 */
export class ApiKeyPolicy extends BasePolicy {
  name = "apiKey";

  async check(context: PolicyContext): Promise<PolicyResult> {
    const { userId, action, resource, prisma } = context;

    switch (action) {
      case "create": {
        // Check API key limits
        const keyCount = await prisma.apiKey.count({
          where: { userId, isActive: true }
        });

        if (keyCount >= 10) { // Max 10 active keys per user
          return { allowed: false, reason: "Maximum of 10 active API keys allowed" };
        }
        return { allowed: true };
      }

      case "read":
      case "update":
      case "delete":
        // Users can only access their own API keys
        if (resource?.userId !== userId) {
          return { allowed: false, reason: "Access denied to this API key" };
        }
        return { allowed: true };

      default:
        return { allowed: false, reason: "Unknown action" };
    }
  }

  async validateData(context: PolicyContext, data: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 1) {
      errors.push("API key name is required");
    }

    if (data.permissions && !Array.isArray(data.permissions)) {
      errors.push("Permissions must be an array");
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors })
    };
  }
}

/**
 * File Upload Policy - Controls file operations
 */
export class FileUploadPolicy extends BasePolicy {
  name = "fileUpload";

  private readonly ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/csv', 'application/json'
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async check(context: PolicyContext): Promise<PolicyResult> {
    const { userId, action, resource } = context;

    switch (action) {
      case "upload": {
        // Check file size and type
        if (resource?.size > this.MAX_FILE_SIZE) {
          return { allowed: false, reason: "File size exceeds 10MB limit" };
        }

        if (!this.ALLOWED_TYPES.includes(resource?.mimeType)) {
          return {
            allowed: false,
            reason: `File type not allowed. Allowed: ${this.ALLOWED_TYPES.join(', ')}`
          };
        }

        return { allowed: true };
      }

      case "read":
      case "delete": {
        // Users can only access their own files
        if (resource?.userId !== userId) {
          return { allowed: false, reason: "Access denied to this file" };
        }
        return { allowed: true };
      }

      default:
        return { allowed: false, reason: "Unknown action" };
    }
  }
}

/**
 * Integration Policy - Controls third-party integrations
 */
export class IntegrationPolicy extends BasePolicy {
  name = "integration";

  async check(context: PolicyContext): Promise<PolicyResult> {
    const { userId, action, resource, prisma } = context;

    switch (action) {
      case "create": {
        // Check integration limits
        const integrationCount = await prisma.integration.count({
          where: { userId, isActive: true }
        });

        if (integrationCount >= 20) { // Max 20 active integrations per user
          return { allowed: false, reason: "Maximum of 20 active integrations allowed" };
        }
        return { allowed: true };
      }

      case "read":
      case "update":
      case "delete":
        // Users can only access their own integrations
        if (resource?.userId !== userId) {
          return { allowed: false, reason: "Access denied to this integration" };
        }
        return { allowed: true };

      default:
        return { allowed: false, reason: "Unknown action" };
    }
  }

  async validateData(context: PolicyContext, data: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!data.type || !data.name) {
      errors.push("Integration type and name are required");
    }

    const validTypes = ['ZAPIER', 'MAKE', 'WEBHOOK', 'SLACK', 'DISCORD', 'GOOGLE_SHEETS', 'HUBSPOT', 'SALESFORCE', 'PIPEDRIVE', 'ZOHO'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push(`Invalid integration type. Must be one of: ${validTypes.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors })
    };
  }
}