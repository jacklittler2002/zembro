#!/usr/bin/env ts-node

/**
 * Policy System Initialization and Demo
 *
 * This script demonstrates how to initialize and use the comprehensive
 * data protection policy system in the Zembro platform.
 */

import { PolicyRegistry, PolicyGuard, BusinessRules, SecurityPolicies } from "../src/policies/policyRegistry";
import { PolicyMiddleware } from "../src/policies/policyMiddleware";
import { PolicyIntegration } from "../src/policies/policyIntegration";
import { prisma } from "../src/db";

/**
 * Initialize the Policy System
 *
 * Call this function once at application startup
 */
async function initializePolicySystem() {
  console.log("🚀 Initializing Zembro Policy System...");

  try {
    // Initialize policy registry with Prisma
    PolicyRegistry.initialize(prisma);
    console.log("✅ Policy registry initialized");

    // Initialize middleware
    PolicyMiddleware.initialize();
    console.log("✅ Policy middleware initialized");

    // Initialize integration helpers
    PolicyIntegration.initialize();
    console.log("✅ Policy integration initialized");

    console.log("🎉 Policy system ready!");
    return true;

  } catch (error: any) {
    console.error("❌ Policy system initialization failed:", error.message);
    return false;
  }
}

/**
 * Demo: Policy Enforcement Examples
 */
async function demonstratePolicies() {
  console.log("\n📋 Demonstrating Policy Enforcement...");

  // Example user ID (would come from authentication)
  const userId = "user_123";

  try {
    // 1. Check basic permissions
    console.log("1. Checking basic permissions:");
    const canCreateSearch = await PolicyGuard.canCreate(userId, "leadSearch");
    console.log(`   Can create lead search: ${canCreateSearch}`);

    const canCreateCampaign = await PolicyGuard.canCreate(userId, "campaign");
    console.log(`   Can create campaign: ${canCreateCampaign}`);

    // 2. Validate data
    console.log("\n2. Validating data:");
    const searchValidation = await PolicyGuard.validateData(userId, "leadSearch", "create", {
      query: "SaaS companies in healthcare",
      maxLeads: 100
    });
    console.log(`   Lead search validation: ${searchValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
    if (!searchValidation.valid) {
      console.log(`   Errors: ${searchValidation.errors?.join(', ')}`);
    }

    // 3. Check business rules
    console.log("\n3. Checking business rules:");
    const creditCheck = await BusinessRules.checkCreditBalance(userId, 25, "lead_search");
    console.log(`   Credit check (25 needed): ${creditCheck.sufficient ? '✅ Sufficient' : '❌ Insufficient'}`);
    console.log(`   Current balance: ${creditCheck.currentBalance}`);

    const planLimits = await BusinessRules.checkPlanLimits(userId, "lead_search");
    console.log(`   Plan limits check: ${planLimits.allowed ? '✅ Allowed' : '❌ Denied'}`);
    if (planLimits.limit) {
      console.log(`   Limit: ${planLimits.limit}, Current: ${planLimits.current || 0}`);
    }

    // 4. Security checks
    console.log("\n4. Security checks:");
    const rateLimit = await SecurityPolicies.checkRateLimit(userId, "api_call");
    console.log(`   Rate limit check: ${rateLimit.allowed ? '✅ Allowed' : '❌ Rate limited'}`);
    console.log(`   Remaining requests: ${rateLimit.remaining}`);

    // 5. Input sanitization
    console.log("\n5. Input sanitization:");
    const dangerousInput = "<script>alert('xss')</script>Hello & welcome";
    const sanitized = SecurityPolicies.sanitizeInput(dangerousInput);
    console.log(`   Original: ${dangerousInput}`);
    console.log(`   Sanitized: ${sanitized}`);

    // 6. File upload validation
    console.log("\n6. File upload validation:");
    const fileCheck = await BusinessRules.checkFileUpload(userId, {
      size: 1024 * 1024, // 1MB
      type: "application/pdf",
      name: "document.pdf"
    });
    console.log(`   File upload check: ${fileCheck.allowed ? '✅ Allowed' : '❌ Denied'}`);
    if (!fileCheck.allowed) {
      console.log(`   Reason: ${fileCheck.reason}`);
    }

  } catch (error: any) {
    console.error("❌ Policy demonstration failed:", error.message);
  }
}

/**
 * Demo: Policy-Aware Service Usage
 */
async function demonstrateServiceIntegration() {
  console.log("\n🔧 Demonstrating Service Integration...");

  // This would be in your actual service classes
  class ExampleLeadSearchService {
    async createLeadSearch(userId: string, data: any) {
      // Use PolicyIntegration helper
      return await PolicyIntegration.withPolicyAndValidation(
        userId,
        "create",
        "leadSearch",
        data,
        async () => {
          // Actual business logic here
          console.log("   Creating lead search in database...");
          return { id: "search_123", ...data };
        }
      );
    }
  }

  try {
    const service = new ExampleLeadSearchService();
    const result = await service.createLeadSearch("user_123", {
      query: "tech startups",
      maxLeads: 50
    });

    console.log("   ✅ Lead search created successfully");
    console.log(`   Result: ${JSON.stringify(result, null, 2)}`);

  } catch (error: any) {
    console.error("   ❌ Service integration failed:", error.message);
  }
}

/**
 * Demo: Express Route Integration
 */
function demonstrateRouteIntegration() {
  console.log("\n🌐 Demonstrating Route Integration...");

  // Mock Express app for demonstration
  const mockApp = {
    post: (path: string, ...middlewares: any[]) => {
      console.log(`   Route: POST ${path}`);
      console.log(`   Middleware count: ${middlewares.length}`);
      middlewares.forEach((mw, i) => {
        if (mw.name) {
          console.log(`     ${i + 1}. ${mw.name}`);
        } else {
          console.log(`     ${i + 1}. ${mw.toString().substring(0, 50)}...`);
        }
      });
    }
  };

  // Example route with policy middleware
  mockApp.post("/api/lead-searches",
    PolicyMiddleware.attachEnforcer,
    PolicyMiddleware.check("leadSearch", "create"),
    PolicyMiddleware.validate("leadSearch"),
    PolicyMiddleware.businessRules("lead_search"),
    PolicyMiddleware.checkCredits(25, "lead_search"),
    async (req: any, res: any) => {
      // Route handler
      res.json({ success: true });
    }
  );

  console.log("   ✅ Route configured with policy protection");
}

/**
 * Main demonstration function
 */
async function main() {
  console.log("🛡️  Zembro Data Protection Policy System Demo");
  console.log("================================================");

  // Initialize the policy system
  const initialized = await initializePolicySystem();
  if (!initialized) {
    process.exit(1);
  }

  // Run demonstrations
  await demonstratePolicies();
  await demonstrateServiceIntegration();
  demonstrateRouteIntegration();

  console.log("\n🎯 Policy System Demo Complete!");
  console.log("\n📚 Next Steps:");
  console.log("1. Integrate PolicyRegistry.initialize() in your app startup");
  console.log("2. Add PolicyMiddleware.attachEnforcer to your request pipeline");
  console.log("3. Extend PolicyAwareService in your service classes");
  console.log("4. Add policy middleware to your routes");
  console.log("5. Test all policy enforcement thoroughly");

  console.log("\n🔗 Resources:");
  console.log("- DATA_PROTECTION_POLICIES.md - Complete documentation");
  console.log("- src/policies/ - Source code for all policies");
  console.log("- supabase-policies.sql - Database RLS policies");
}

// Run the demo
main().catch(console.error);