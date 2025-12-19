import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import bodyParser from "body-parser";
import { logger } from "./logger";
import { handleTedChat } from "./ted/tedService";
import { getCreditBalance } from "./ted/creditService";
import { listUserConversations, getConversation } from "./ted/conversationService";
import { exportLeadSearchToCsv } from "./export/leadSearchExportService";
import { getLeadSearchById, getLeadSearchLeads } from "./leadSearch/leadSearchService";
import { prisma } from "./db";
import { authMiddleware, AuthedRequest } from "./auth/authMiddleware";
import billingRoutes from "./billing/billingRoutes";
import webhookRoutes from "./billing/webhookRoutes";
import { CreditError } from "./ted/creditService";
import { getUserPlanCode } from "./billing/getUserPlan";
import { PLAN_LIMITS } from "./billing/planLimits";
import {
  testSmtpConnection,
  addEmailAccount,
  getUserEmailAccounts,
  deleteEmailAccount,
} from "./email/emailAccountService";
import {
  createCampaign,
  getCampaignById,
  listUserCampaigns,
  updateCampaignStatus,
  deleteCampaign,
  importLeadsFromSearch,
} from "./email/campaignService";
import { getCampaignStats } from "./email/emailSendingService";
import {
  purchaseInstantlyAccounts,
  handleInstantlyWebhook,
} from "./email/instantlyService";
import { mountListRoutes } from "./routes/lists";
import leadSearchProgressRouter from "./routes/leadSearchProgress";
import { cacheMiddleware } from "./utils/cache";
import { PolicyMiddleware } from "./policies/policyMiddleware";

const app = express();

// Register lead search progress API
app.use("/api", leadSearchProgressRouter);

// Enable CORS for frontend

const allowedOrigins = [process.env.APP_URL].filter(Boolean);
app.use(cors({
  origin: function(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// Basic rate limiting (100 requests per 15 minutes per IP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// IMPORTANT: Webhook routes must be registered BEFORE bodyParser
// because Stripe webhook needs raw body
app.use(webhookRoutes);

app.use(bodyParser.json());

// Attach policy enforcer to all requests
app.use(PolicyMiddleware.attachEnforcer);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    logger.error("Healthcheck failed", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Register billing routes
app.use(billingRoutes);

/**
 * POST /api/ted/chat
 * Send a message to TED and get a response.
 * Body: { message: string, conversationId?: string }
 */
app.post("/api/ted/chat", 
  authMiddleware, 
  PolicyMiddleware.check("ted", "chat"),
  async (req: AuthedRequest, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.userId!;

    if (!message) {
      return res.status(400).json({
        error: "Missing required field: message",
      });
    }

    // Use TED service instead of old agent
    const result = await handleTedChat(userId, message, conversationId);

    return res.json({
      success: true,
      conversationId: result.conversationId,
      assistantMessage: result.assistantMessage,
      creditsUsed: result.creditsUsed,
      remainingBalance: result.remainingBalance,
    });
  } catch (error: any) {
    logger.error(`Error in /api/ted/chat: ${error.message}`);
    
    // Handle credit errors specially
    if (error instanceof CreditError) {
      return res.status(402).json({
        error: error.message,
        code: error.code,
        details: error.details,
        upgradeSuggestion: true,
      });
    }
    
    return res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/ted/balance
 * Get the credit balance for the authenticated user.
 */
app.get("/api/ted/balance", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const balance = await getCreditBalance(userId);

    return res.json({
      success: true,
      userId,
      balance,
    });
  } catch (error: any) {
    logger.error(`Error in /api/ted/balance: ${error.message}`);
    return res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/ted/conversations
 * List all conversations for the authenticated user.
 */
app.get("/api/ted/conversations", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const conversations = await listUserConversations(userId);

    return res.json({
      success: true,
      conversations,
    });
  } catch (error: any) {
    logger.error(`Error in /api/ted/conversations: ${error.message}`);
    return res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/ted/conversation/:conversationId
 * Get a specific conversation with all messages.
 */
app.get("/api/ted/conversation/:conversationId", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({ error: "Missing conversationId" });
    }
    
    // TODO: Verify conversation belongs to this user
    const conversation = await getConversation(conversationId);

    return res.json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    logger.error(`Error in /api/ted/conversation: ${error.message}`);
    return res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Health check endpoint with database connectivity test
 */
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as health_check`;
    res.json({ 
      status: "ok", 
      database: "connected",
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    logger.error("Healthcheck failed", err);
    res.status(500).json({ 
      status: "error", 
      database: "disconnected",
      error: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/lead-searches
 * Create a new LeadSearch
 * Body: { query: string, maxLeads?: number, filters?: any }
 */
app.post("/api/lead-searches", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { query, maxLeads, filters } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Missing required field: query",
      });
    }

    const { LeadSearchService } = await import("./leadSearch/leadSearchService");
    const service = new LeadSearchService();
    const leadSearch = await service.createLeadSearch({
      userId,
      query,
      maxLeads,
      filters,
    });

    return res.json({
      success: true,
      leadSearch,
      message: "Lead search created. Credits will be charged only for net-new leads found.",
    });
  } catch (error: any) {
    logger.error(`Error in /api/lead-searches: ${error.message}`);
    if (error?.code === "PLAN_LIMIT_REACHED") {
      return res.status(403).json({
        error: "PLAN_LIMIT_REACHED",
        limit: error.limit,
        allowed: error.allowed,
      });
    }
    if (error.message?.includes("Insufficient credits")) {
      return res.status(402).json({
        error: error.message,
        code: "INSUFFICIENT_CREDITS",
        upgradeSuggestion: true,
      });
    }
    return res.status(500).json({
      error: error.message || "Failed to create LeadSearch",
    });
  }
});

/**
 * GET /api/lead-searches
 * List all LeadSearches for the authenticated user
 */
app.get(
  "/api/lead-searches",
  authMiddleware,
  cacheMiddleware((req) => `lead-searches:${req.userId}`, 60),
  async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    
    const leadSearches = await prisma.leadSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        query: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        contactsFoundCount: true,
        crawledCount: true,
        discoveredCount: true,
        enrichedCount: true,
        creditsCharged: true,
        totalFound: true,
        totalDeduped: true,
        totalNetNew: true,
      },
    });

    return res.json({
      success: true,
      leadSearches,
      message: "Credits are charged per net-new lead delivered (1 credit = 1 unique lead)",
    });
  } catch (error: any) {
    logger.error(`Error in /api/lead-searches: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to fetch LeadSearches",
    });
  }
});

/**
 * GET /api/lead-searches/:id
 * Get a single LeadSearch by ID
 */
app.get("/api/lead-searches/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    
    if (!id) {
      return res.status(400).json({ error: "Missing lead search ID" });
    }
    
    const leadSearch = await getLeadSearchById(id);

    if (!leadSearch || leadSearch.userId !== userId) {
      return res.status(404).json({
        error: "LeadSearch not found",
      });
    }

    return res.json({
      success: true,
      leadSearch,
    });
  } catch (error: any) {
    logger.error(`Error in /api/lead-searches/:id: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to fetch LeadSearch",
    });
  }
});

/**
 * POST /api/lead-searches/:id/feedback
 * Submit feedback/rating for a lead (by company/contact)
 * Body: { companyId: string, contactId?: string, rating: number, feedback?: string, aiScore?: number }
 */
app.post("/api/lead-searches/:id/feedback", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id: leadSearchId } = req.params;
    const userId = req.userId!;
    const { companyId, contactId, rating, feedback, aiScore } = req.body;
    if (!companyId || typeof rating !== "number") {
      return res.status(400).json({ error: "Missing required fields: companyId, rating" });
    }
    // Upsert feedback (one per user/company/contact/leadSearch)
    // Build compound key object, only include leadSearchId if defined
    const compoundKey: any = { userId, companyId, contactId: contactId || null };
    if (typeof leadSearchId !== 'undefined') compoundKey.leadSearchId = leadSearchId;
    const createObj: any = { userId, companyId, contactId, rating, feedback, aiScore };
    if (typeof leadSearchId !== 'undefined') createObj.leadSearchId = leadSearchId;
    const result = await prisma.aIFeedback.upsert({
      where: { userId_companyId_contactId_leadSearchId: compoundKey },
      update: { rating, feedback, aiScore },
      create: createObj,
    });
    return res.json({ success: true, feedback: result });
  } catch (error: any) {
    logger.error(`/api/lead-searches/:id/feedback POST: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/lead-searches/:id/feedback
 * Get all feedback for a lead search (for this user)
 */
app.get("/api/lead-searches/:id/feedback", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id: leadSearchId } = req.params;
    const userId = req.userId!;
    const whereObj: any = { userId };
    if (typeof leadSearchId !== 'undefined') whereObj.leadSearchId = leadSearchId;
    const feedbacks = await prisma.aIFeedback.findMany({
      where: whereObj,
    });
    return res.json({ success: true, feedbacks });
  } catch (error: any) {
    logger.error(`/api/lead-searches/:id/feedback GET: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/lead-searches/:id/leads
 * Get leads for a specific LeadSearch with advanced filtering
 * Query params: limit?, minScore?, industry?, sizeBucket?, country?, decisionMakerOnly?, excludePreviousExports?
 */
app.get("/api/lead-searches/:id/leads", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { limit, minScore, industry, sizeBucket, country, decisionMakerOnly, excludePreviousExports, jobTitle, techStack, fundingStage } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing lead search ID" });
    }

    // Verify ownership
    const leadSearch = await getLeadSearchById(id);
    if (!leadSearch || leadSearch.userId !== userId) {
      return res.status(404).json({ error: "LeadSearch not found" });
    }

    const leads = await getLeadSearchLeads(id, {
      ...(limit ? { limit: Number(limit) } : {}),
      ...(minScore ? { minScore: Number(minScore) } : {}),
      ...(industry ? { industry: String(industry) } : {}),
      ...(sizeBucket ? { sizeBucket: String(sizeBucket) } : {}),
      ...(country ? { country: String(country) } : {}),
      ...(decisionMakerOnly === "true" ? { decisionMakerOnly: true } : {}),
      ...(excludePreviousExports !== "false" ? { excludePreviousExports: true, userId } : {}),
      ...(jobTitle ? { jobTitle: String(jobTitle) } : {}),
      ...(techStack ? { techStack: Array.isArray(techStack) ? techStack.filter((t: any) => typeof t === 'string').map(String) : String(techStack).split(",") } : {}),
      ...(fundingStage ? { fundingStage: String(fundingStage) } : {}),
    });

    return res.json({
      success: true,
      leads,
      count: leads.length,
    });
  } catch (error: any) {
    logger.error(`Error in /api/lead-searches/:id/leads: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to fetch leads",
    });
  }
});

/**
 * GET /api/lead-searches/:id/export
 * Export a LeadSearch to CSV format
 * Query params: excludePreviousExports=true|false (default: true)
 */
app.get("/api/lead-searches/:id/export", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const excludePreviousExports = req.query.excludePreviousExports !== "false"; // Default true

    if (!id) {
      return res.status(400).json({ error: "Missing lead search ID" });
    }

    // Verify ownership
    const leadSearch = await getLeadSearchById(id);
    if (!leadSearch || leadSearch.userId !== userId) {
      return res.status(404).json({ error: "LeadSearch not found" });
    }

    const plan = await getUserPlanCode(userId);
    const limits = PLAN_LIMITS[plan];

    const leads = await getLeadSearchLeads(id, {
      excludePreviousExports,
      userId,
      limit: limits.maxExportContactsPerExport + 1,
    });

    if (leads.length > limits.maxExportContactsPerExport) {
      return res.status(403).json({
        error: "UPGRADE_REQUIRED",
        limit: "maxExportContactsPerExport",
        allowed: limits.maxExportContactsPerExport,
        plan,
      });
    }

    const csv = await exportLeadSearchToCsv(id, userId, {
      excludePreviousExports,
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="lead-search-${id}.csv"`
    );
    return res.send(csv);
  } catch (error: any) {
    logger.error(`Error in /api/lead-searches/:id/export: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to export CSV",
    });
  }
});

// ==================== EMAIL ACCOUNT ROUTES ====================

/**
 * POST /api/email-accounts
 * Add a BYOE email account
 * Body: { email, fromName?, smtpHost, smtpPort, smtpUsername, smtpPassword, imapHost?, imapPort?, imapUsername?, imapPassword?, dailySendLimit? }
 */
app.post("/api/email-accounts", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const accountData = req.body;

    if (!accountData.email || !accountData.smtpHost || !accountData.smtpPort || !accountData.smtpUsername || !accountData.smtpPassword) {
      return res.status(400).json({
        error: "Missing required fields: email, smtpHost, smtpPort, smtpUsername, smtpPassword",
      });
    }

    const account = await addEmailAccount(userId, accountData);

    return res.json({
      success: true,
      account,
    });
  } catch (error: any) {
    logger.error(`Error in /api/email-accounts: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to add email account",
    });
  }
});

/**
 * POST /api/email-accounts/test
 * Test SMTP connection before saving
 * Body: { smtpHost, smtpPort, smtpUsername, smtpPassword }
 */
app.post("/api/email-accounts/test", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { smtpHost, smtpPort, smtpUsername, smtpPassword } = req.body;

    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      return res.status(400).json({
        error: "Missing required fields: smtpHost, smtpPort, smtpUsername, smtpPassword",
      });
    }

    const isValid = await testSmtpConnection({
      host: smtpHost,
      port: Number(smtpPort),
      username: smtpUsername,
      password: smtpPassword,
    });

    return res.json({
      success: true,
      valid: isValid,
    });
  } catch (error: any) {
    logger.error(`Error in /api/email-accounts/test: ${error.message}`);
    return res.status(400).json({
      success: false,
      error: error.message || "SMTP connection test failed",
    });
  }
});

/**
 * GET /api/email-accounts
 * List all email accounts for the authenticated user
 */
app.get("/api/email-accounts", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const accounts = await getUserEmailAccounts(userId);

    return res.json({
      success: true,
      accounts,
    });
  } catch (error: any) {
    logger.error(`Error in /api/email-accounts: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to fetch email accounts",
    });
  }
});

/**
 * DELETE /api/email-accounts/:id
 * Delete an email account
 */
app.delete("/api/email-accounts/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    if (!id) {
      return res.status(400).json({ error: "Missing account ID" });
    }

    await deleteEmailAccount(id, userId);

    return res.json({
      success: true,
      message: "Email account deleted",
    });
  } catch (error: any) {
    logger.error(`Error in /api/email-accounts/:id: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to delete email account",
    });
  }
});

/**
 * POST /api/email-accounts/purchase
 * Purchase email accounts from Instantly.ai
 * Body: { quantity: number }
 */
app.post("/api/email-accounts/purchase", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        error: "Invalid quantity. Must be at least 1.",
      });
    }

    const result = await purchaseInstantlyAccounts(userId, quantity);

    return res.json({
      success: true,
      orderId: result.orderId,
      message: "Order placed. Accounts will be provisioned within 24 hours.",
    });
  } catch (error: any) {
    logger.error(`Error in /api/email-accounts/purchase: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to purchase email accounts",
    });
  }
});

/**
 * POST /webhooks/instantly
 * Webhook receiver for Instantly.ai account provisioning
 * Body: { orderId, customerId (userId), accounts: [...] }
 */
app.post("/webhooks/instantly", async (req, res) => {
  try {
    await handleInstantlyWebhook(req.body);

    return res.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error: any) {
    logger.error(`Error in /webhooks/instantly: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to process webhook",
    });
  }
});

// ==================== LISTS ROUTES ====================
mountListRoutes(app, logger);

// ==================== LEADS ROUTES ====================

/**
 * GET /api/leads
 * Get all leads with filtering and pagination
 * Query params: industry, sizeBucket, country, minScore, isFavorited, isArchived, search, page, pageSize
 */
app.get(
  "/api/leads",
  authMiddleware,
  cacheMiddleware((req) => `leads:${req.userId}:${JSON.stringify(req.query)}`, 60),
  async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const {
      industry,
      sizeBucket,
      country,
      minScore,
      isFavorited,
      isArchived,
      search,
      page,
      pageSize,
    } = req.query;

    const { getLeads } = await import("./leads/leadService");
    const result = await getLeads({
      userId,
      ...(industry && { industry: industry as string }),
      ...(sizeBucket && { sizeBucket: sizeBucket as any }),
      ...(country && { country: country as string }),
      ...(minScore && { minScore: Number(minScore) }),
      ...(isFavorited === "true" && { isFavorited: true }),
      ...(isFavorited === "false" && { isFavorited: false }),
      ...(isArchived === "true" && { isArchived: true }),
      ...(isArchived === "false" && { isArchived: false }),
      ...(search && { search: search as string }),
      ...(page && { page: Number(page) }),
      ...(pageSize && { pageSize: Number(pageSize) }),
    });

    res.json(result);
  } catch (error: any) {
    logger.error("Error fetching leads", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leads/stats
 * Get lead statistics for the user
 */
app.get(
  "/api/leads/stats",
  authMiddleware,
  cacheMiddleware((req) => `leads:stats:${req.userId}`, 60),
  async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;

    const { getLeadStats } = await import("./leads/leadService");
    const stats = await getLeadStats(userId);

    res.json(stats);
  } catch (error: any) {
    logger.error("Error fetching lead stats", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leads/filters/industries
 * Get unique industries from user's leads
 */
app.get(
  "/api/leads/filters/industries",
  authMiddleware,
  cacheMiddleware(() => `leads:filters:industries`, 600),
  async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;

    const { getLeadIndustries } = await import("./leads/leadService.js");
    const industries = await getLeadIndustries(userId);

    res.json(industries);
  } catch (error: any) {
    logger.error("Error fetching industries", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leads/filters/countries
 * Get unique countries from user's leads
 */
app.get(
  "/api/leads/filters/countries",
  authMiddleware,
  cacheMiddleware(() => `leads:filters:countries`, 600),
  async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;

    const { getLeadCountries } = await import("./leads/leadService.js");
    const countries = await getLeadCountries(userId);

    res.json(countries);
  } catch (error: any) {
    logger.error("Error fetching countries", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leads/:id
 * Get a single lead by ID with full details
 */
app.get("/api/leads/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const id = req.params.id!;

    const { getLeadById } = await import("./leads/leadService.js");
    const lead = await getLeadById(id, userId);

    res.json(lead);
  } catch (error: any) {
    logger.error("Error fetching lead", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/leads/:id
 * Update lead (favorite, archive, notes)
 * Body: { isFavorited?, isArchived?, notes? }
 */
app.patch("/api/leads/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const id = req.params.id!;
    const { isFavorited, isArchived, notes } = req.body;

    const { updateLead } = await import("./leads/leadService.js");
    const lead = await updateLead({
      companyId: id,
      userId,
      isFavorited,
      isArchived,
      notes,
    });

    res.json(lead);
  } catch (error: any) {
    logger.error("Error updating lead", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ==================== CAMPAIGN ROUTES ====================

/**
 * POST /api/campaigns
 * Create a new email campaign
 * Body: { name, leadSearchId?, emailAccountIds: [...], steps: [...], scheduleStartAt?, sendTimeStart?, sendTimeEnd?, dailyLimit? }
 */
app.post("/api/campaigns", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const campaignData = req.body;

    if (!campaignData.name || !campaignData.emailAccountIds || !campaignData.steps) {
      return res.status(400).json({
        error: "Missing required fields: name, emailAccountIds, steps",
      });
    }

    const campaign = await createCampaign({
      ...campaignData,
      userId,
    });

    return res.json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    logger.error(`Error in /api/campaigns: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to create campaign",
    });
  }
});

/**
 * GET /api/campaigns
 * List all campaigns for the authenticated user
 */
app.get("/api/campaigns", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const campaigns = await listUserCampaigns(userId);

    return res.json({
      success: true,
      campaigns,
    });
  } catch (error: any) {
    logger.error(`Error in /api/campaigns: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to fetch campaigns",
    });
  }
});

/**
 * GET /api/campaigns/:id
 * Get a specific campaign
 */
app.get("/api/campaigns/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    if (!id) {
      return res.status(400).json({ error: "Missing campaign ID" });
    }

    const campaign = await getCampaignById(id, userId);

    return res.json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    logger.error(`Error in /api/campaigns/:id: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to fetch campaign",
    });
  }
});

/**
 * POST /api/campaigns/:id/import-leads
 * Import leads from a lead search into campaign queue
 * Body: { minScore?, industry?, sizeBucket?, country?, decisionMakerOnly?, excludePreviousExports?, limit? }
 */
app.post("/api/campaigns/:id/import-leads", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const filters = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing campaign ID" });
    }

    const result = await importLeadsFromSearch(id, userId, filters);

    return res.json({
      success: true,
      leadsImported: result.leadsImported,
      emailsQueued: result.emailsQueued,
    });
  } catch (error: any) {
    logger.error(`Error in /api/campaigns/:id/import-leads: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to import leads",
    });
  }
});

/**
 * POST /api/campaigns/:id/status
 * Update campaign status (start, pause, etc.)
 * Body: { status: "DRAFT" | "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" }
 */
app.post("/api/campaigns/:id/status", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing campaign ID" });
    }

    if (!status) {
      return res.status(400).json({ error: "Missing status" });
    }

    await updateCampaignStatus(id, userId, status);

    return res.json({
      success: true,
      message: `Campaign status updated to ${status}`,
    });
  } catch (error: any) {
    logger.error(`Error in /api/campaigns/:id/status: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to update campaign status",
    });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign
 */
app.delete("/api/campaigns/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    if (!id) {
      return res.status(400).json({ error: "Missing campaign ID" });
    }

    await deleteCampaign(id, userId);

    return res.json({
      success: true,
      message: "Campaign deleted",
    });
  } catch (error: any) {
    logger.error(`Error in /api/campaigns/:id: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to delete campaign",
    });
  }
});

/**
 * GET /api/campaigns/:id/stats
 * Get campaign statistics
 */
app.get("/api/campaigns/:id/stats", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    if (!id) {
      return res.status(400).json({ error: "Missing campaign ID" });
    }

    // Verify ownership
    await getCampaignById(id, userId);

    const stats = await getCampaignStats(id);

    return res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logger.error(`Error in /api/campaigns/:id/stats: ${error.message}`);
    return res.status(500).json({
      error: error.message || "Failed to fetch campaign stats",
    });
  }
});

export function startHttpServer(port: number) {
  app.listen(port, () => {
    logger.info(`HTTP server listening on port ${port}`);
  });
}
