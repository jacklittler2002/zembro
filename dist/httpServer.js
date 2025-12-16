"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHttpServer = startHttpServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const logger_js_1 = require("./logger.js");
const creditService_js_1 = require("./ted/creditService.js");
const conversationService_js_1 = require("./ted/conversationService.js");
const tedAgent_js_1 = require("./ted/tedAgent.js");
const leadSearchExportService_js_1 = require("./export/leadSearchExportService.js");
const leadSearchService_js_1 = require("./leadSearch/leadSearchService.js");
const db_js_1 = require("./db.js");
const authMiddleware_js_1 = require("./auth/authMiddleware.js");
const billingRoutes_js_1 = __importDefault(require("./billing/billingRoutes.js"));
const webhookRoutes_js_1 = __importDefault(require("./billing/webhookRoutes.js"));
const creditService_js_2 = require("./ted/creditService.js");
const getUserPlan_js_1 = require("./billing/getUserPlan.js");
const planLimits_js_1 = require("./billing/planLimits.js");
const emailAccountService_js_1 = require("./email/emailAccountService.js");
const campaignService_js_1 = require("./email/campaignService.js");
const emailSendingService_js_1 = require("./email/emailSendingService.js");
const instantlyService_js_1 = require("./email/instantlyService.js");
const lists_js_1 = require("./routes/lists.js");
const app = (0, express_1.default)();
// Enable CORS for frontend
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
// IMPORTANT: Webhook routes must be registered BEFORE bodyParser
// because Stripe webhook needs raw body
app.use(webhookRoutes_js_1.default);
app.use(body_parser_1.default.json());
// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        await db_js_1.prisma.$queryRaw `SELECT 1`;
        return res.json({ ok: true, timestamp: new Date().toISOString() });
    }
    catch (err) {
        logger_js_1.logger.error("Healthcheck failed", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});
// Register billing routes
app.use(billingRoutes_js_1.default);
/**
 * POST /api/ted/chat
 * Send a message to TED and get a response.
 * Body: { message: string, conversationId?: string }
 */
app.post("/api/ted/chat", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        const userId = req.userId;
        if (!message) {
            return res.status(400).json({
                error: "Missing required field: message",
            });
        }
        // Load conversation context if conversationId provided
        let conversationContext = [];
        if (conversationId) {
            const conversation = await (0, conversationService_js_1.getConversation)(conversationId);
            if (conversation && conversation.userId === userId) {
                const messages = await db_js_1.prisma.tedMessage.findMany({
                    where: { conversationId },
                    orderBy: { createdAt: "asc" },
                    take: 12, // Last 12 messages for context
                });
                conversationContext = messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                }));
            }
        }
        // Use new TED agent instead of old heuristic-based service
        const result = await (0, tedAgent_js_1.runTedAgent)({
            userId,
            message,
            conversationContext,
        });
        // Save conversation if needed (optional - you can create conversation on first message)
        let convId = conversationId;
        if (!convId) {
            convId = await (0, conversationService_js_1.createConversation)(userId, "Chat with TED");
        }
        await (0, conversationService_js_1.appendMessage)(convId, "user", message);
        await (0, conversationService_js_1.appendMessage)(convId, "assistant", result.reply);
        // Deduct 1 credit for TED message
        await (0, creditService_js_1.consumeCredits)(userId, 1, "TED_MESSAGE", { conversationId: convId });
        const newBalance = await (0, creditService_js_1.getCreditBalance)(userId);
        return res.json({
            success: true,
            conversationId: convId,
            assistantMessage: result.reply,
            csv: result.csv ?? null,
            upgradeUrl: result.upgradeUrl ?? null,
            creditsUsed: 1,
            remainingBalance: result.remainingCredits ?? newBalance,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/ted/chat: ${error.message}`);
        // Handle credit errors specially
        if (error instanceof creditService_js_2.CreditError) {
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
app.get("/api/ted/balance", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const balance = await (0, creditService_js_1.getCreditBalance)(userId);
        return res.json({
            success: true,
            userId,
            balance,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/ted/balance: ${error.message}`);
        return res.status(500).json({
            error: error.message,
        });
    }
});
/**
 * GET /api/ted/conversations
 * List all conversations for the authenticated user.
 */
app.get("/api/ted/conversations", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const conversations = await (0, conversationService_js_1.listUserConversations)(userId);
        return res.json({
            success: true,
            conversations,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/ted/conversations: ${error.message}`);
        return res.status(500).json({
            error: error.message,
        });
    }
});
/**
 * GET /api/ted/conversation/:conversationId
 * Get a specific conversation with all messages.
 */
app.get("/api/ted/conversation/:conversationId", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.userId;
        if (!conversationId) {
            return res.status(400).json({ error: "Missing conversationId" });
        }
        // TODO: Verify conversation belongs to this user
        const conversation = await (0, conversationService_js_1.getConversation)(conversationId);
        return res.json({
            success: true,
            conversation,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/ted/conversation: ${error.message}`);
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
        await db_js_1.prisma.$queryRaw `SELECT 1 as health_check`;
        res.json({
            status: "ok",
            database: "connected",
            timestamp: new Date().toISOString()
        });
    }
    catch (err) {
        logger_js_1.logger.error("Healthcheck failed", err);
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
app.post("/api/lead-searches", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { query, maxLeads, filters } = req.body;
        const userId = req.userId;
        if (!query) {
            return res.status(400).json({
                error: "Missing required field: query",
            });
        }
        const leadSearch = await (0, leadSearchService_js_1.createLeadSearch)({
            userId,
            query,
            maxLeads,
            filters,
        });
        return res.json({
            success: true,
            leadSearch,
            message: "LeadSearch created and DISCOVERY job enqueued",
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/lead-searches: ${error.message}`);
        if (error?.code === "PLAN_LIMIT_REACHED") {
            return res.status(403).json({
                error: "PLAN_LIMIT_REACHED",
                limit: error.limit,
                allowed: error.allowed,
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
app.get("/api/lead-searches", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const leadSearches = await db_js_1.prisma.leadSearch.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        return res.json({
            success: true,
            leadSearches,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/lead-searches: ${error.message}`);
        return res.status(500).json({
            error: error.message || "Failed to fetch LeadSearches",
        });
    }
});
/**
 * GET /api/lead-searches/:id
 * Get a single LeadSearch by ID
 */
app.get("/api/lead-searches/:id", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!id) {
            return res.status(400).json({ error: "Missing lead search ID" });
        }
        const leadSearch = await (0, leadSearchService_js_1.getLeadSearchById)(id);
        if (!leadSearch || leadSearch.userId !== userId) {
            return res.status(404).json({
                error: "LeadSearch not found",
            });
        }
        return res.json({
            success: true,
            leadSearch,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/lead-searches/:id: ${error.message}`);
        return res.status(500).json({
            error: error.message || "Failed to fetch LeadSearch",
        });
    }
});
/**
 * GET /api/lead-searches/:id/leads
 * Get leads for a specific LeadSearch with advanced filtering
 * Query params: limit?, minScore?, industry?, sizeBucket?, country?, decisionMakerOnly?, excludePreviousExports?
 */
app.get("/api/lead-searches/:id/leads", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { limit, minScore, industry, sizeBucket, country, decisionMakerOnly, excludePreviousExports } = req.query;
        if (!id) {
            return res.status(400).json({ error: "Missing lead search ID" });
        }
        // Verify ownership
        const leadSearch = await (0, leadSearchService_js_1.getLeadSearchById)(id);
        if (!leadSearch || leadSearch.userId !== userId) {
            return res.status(404).json({ error: "LeadSearch not found" });
        }
        const leads = await (0, leadSearchService_js_1.getLeadSearchLeads)(id, {
            ...(limit ? { limit: Number(limit) } : {}),
            ...(minScore ? { minScore: Number(minScore) } : {}),
            ...(industry ? { industry: String(industry) } : {}),
            ...(sizeBucket ? { sizeBucket: String(sizeBucket) } : {}),
            ...(country ? { country: String(country) } : {}),
            ...(decisionMakerOnly === "true" ? { decisionMakerOnly: true } : {}),
            ...(excludePreviousExports !== "false" ? { excludePreviousExports: true, userId } : {}),
        });
        return res.json({
            success: true,
            leads,
            count: leads.length,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/lead-searches/:id/leads: ${error.message}`);
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
app.get("/api/lead-searches/:id/export", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const excludePreviousExports = req.query.excludePreviousExports !== "false"; // Default true
        if (!id) {
            return res.status(400).json({ error: "Missing lead search ID" });
        }
        // Verify ownership
        const leadSearch = await (0, leadSearchService_js_1.getLeadSearchById)(id);
        if (!leadSearch || leadSearch.userId !== userId) {
            return res.status(404).json({ error: "LeadSearch not found" });
        }
        const plan = await (0, getUserPlan_js_1.getUserPlanCode)(userId);
        const limits = planLimits_js_1.PLAN_LIMITS[plan];
        const leads = await (0, leadSearchService_js_1.getLeadSearchLeads)(id, {
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
        const csv = await (0, leadSearchExportService_js_1.exportLeadSearchToCsv)(id, userId, {
            excludePreviousExports,
        });
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="lead-search-${id}.csv"`);
        return res.send(csv);
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/lead-searches/:id/export: ${error.message}`);
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
app.post("/api/email-accounts", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const accountData = req.body;
        if (!accountData.email || !accountData.smtpHost || !accountData.smtpPort || !accountData.smtpUsername || !accountData.smtpPassword) {
            return res.status(400).json({
                error: "Missing required fields: email, smtpHost, smtpPort, smtpUsername, smtpPassword",
            });
        }
        const account = await (0, emailAccountService_js_1.addEmailAccount)(userId, accountData);
        return res.json({
            success: true,
            account,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/email-accounts: ${error.message}`);
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
app.post("/api/email-accounts/test", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { smtpHost, smtpPort, smtpUsername, smtpPassword } = req.body;
        if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
            return res.status(400).json({
                error: "Missing required fields: smtpHost, smtpPort, smtpUsername, smtpPassword",
            });
        }
        const isValid = await (0, emailAccountService_js_1.testSmtpConnection)({
            host: smtpHost,
            port: Number(smtpPort),
            username: smtpUsername,
            password: smtpPassword,
        });
        return res.json({
            success: true,
            valid: isValid,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/email-accounts/test: ${error.message}`);
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
app.get("/api/email-accounts", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const accounts = await (0, emailAccountService_js_1.getUserEmailAccounts)(userId);
        return res.json({
            success: true,
            accounts,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/email-accounts: ${error.message}`);
        return res.status(500).json({
            error: error.message || "Failed to fetch email accounts",
        });
    }
});
/**
 * DELETE /api/email-accounts/:id
 * Delete an email account
 */
app.delete("/api/email-accounts/:id", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!id) {
            return res.status(400).json({ error: "Missing account ID" });
        }
        await (0, emailAccountService_js_1.deleteEmailAccount)(id, userId);
        return res.json({
            success: true,
            message: "Email account deleted",
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/email-accounts/:id: ${error.message}`);
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
app.post("/api/email-accounts/purchase", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { quantity } = req.body;
        if (!quantity || quantity < 1) {
            return res.status(400).json({
                error: "Invalid quantity. Must be at least 1.",
            });
        }
        const result = await (0, instantlyService_js_1.purchaseInstantlyAccounts)(userId, quantity);
        return res.json({
            success: true,
            orderId: result.orderId,
            message: "Order placed. Accounts will be provisioned within 24 hours.",
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/email-accounts/purchase: ${error.message}`);
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
        await (0, instantlyService_js_1.handleInstantlyWebhook)(req.body);
        return res.json({
            success: true,
            message: "Webhook processed",
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /webhooks/instantly: ${error.message}`);
        return res.status(500).json({
            error: error.message || "Failed to process webhook",
        });
    }
});
// ==================== LISTS ROUTES ====================
(0, lists_js_1.mountListRoutes)(app, logger_js_1.logger);
// ==================== LEADS ROUTES ====================
/**
 * GET /api/leads
 * Get all leads with filtering and pagination
 * Query params: industry, sizeBucket, country, minScore, isFavorited, isArchived, search, page, pageSize
 */
app.get("/api/leads", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { industry, sizeBucket, country, minScore, isFavorited, isArchived, search, page, pageSize, } = req.query;
        const { getLeads } = await Promise.resolve().then(() => __importStar(require("./leads/leadService.js")));
        const result = await getLeads({
            userId,
            ...(industry && { industry: industry }),
            ...(sizeBucket && { sizeBucket: sizeBucket }),
            ...(country && { country: country }),
            ...(minScore && { minScore: Number(minScore) }),
            ...(isFavorited === "true" && { isFavorited: true }),
            ...(isFavorited === "false" && { isFavorited: false }),
            ...(isArchived === "true" && { isArchived: true }),
            ...(isArchived === "false" && { isArchived: false }),
            ...(search && { search: search }),
            ...(page && { page: Number(page) }),
            ...(pageSize && { pageSize: Number(pageSize) }),
        });
        res.json(result);
    }
    catch (error) {
        logger_js_1.logger.error("Error fetching leads", { error: error.message });
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/leads/stats
 * Get lead statistics for the user
 */
app.get("/api/leads/stats", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { getLeadStats } = await Promise.resolve().then(() => __importStar(require("./leads/leadService.js")));
        const stats = await getLeadStats(userId);
        res.json(stats);
    }
    catch (error) {
        logger_js_1.logger.error("Error fetching lead stats", { error: error.message });
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/leads/filters/industries
 * Get unique industries from user's leads
 */
app.get("/api/leads/filters/industries", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { getLeadIndustries } = await Promise.resolve().then(() => __importStar(require("./leads/leadService.js")));
        const industries = await getLeadIndustries(userId);
        res.json(industries);
    }
    catch (error) {
        logger_js_1.logger.error("Error fetching industries", { error: error.message });
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/leads/filters/countries
 * Get unique countries from user's leads
 */
app.get("/api/leads/filters/countries", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { getLeadCountries } = await Promise.resolve().then(() => __importStar(require("./leads/leadService.js")));
        const countries = await getLeadCountries(userId);
        res.json(countries);
    }
    catch (error) {
        logger_js_1.logger.error("Error fetching countries", { error: error.message });
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/leads/:id
 * Get a single lead by ID with full details
 */
app.get("/api/leads/:id", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const id = req.params.id;
        const { getLeadById } = await Promise.resolve().then(() => __importStar(require("./leads/leadService.js")));
        const lead = await getLeadById(id, userId);
        res.json(lead);
    }
    catch (error) {
        logger_js_1.logger.error("Error fetching lead", { error: error.message });
        res.status(500).json({ error: error.message });
    }
});
/**
 * PATCH /api/leads/:id
 * Update lead (favorite, archive, notes)
 * Body: { isFavorited?, isArchived?, notes? }
 */
app.patch("/api/leads/:id", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const id = req.params.id;
        const { isFavorited, isArchived, notes } = req.body;
        const { updateLead } = await Promise.resolve().then(() => __importStar(require("./leads/leadService.js")));
        const lead = await updateLead({
            companyId: id,
            userId,
            isFavorited,
            isArchived,
            notes,
        });
        res.json(lead);
    }
    catch (error) {
        logger_js_1.logger.error("Error updating lead", { error: error.message });
        res.status(500).json({ error: error.message });
    }
});
// ==================== CAMPAIGN ROUTES ====================
/**
 * POST /api/campaigns
 * Create a new email campaign
 * Body: { name, leadSearchId?, emailAccountIds: [...], steps: [...], scheduleStartAt?, sendTimeStart?, sendTimeEnd?, dailyLimit? }
 */
app.post("/api/campaigns", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const campaignData = req.body;
        if (!campaignData.name || !campaignData.emailAccountIds || !campaignData.steps) {
            return res.status(400).json({
                error: "Missing required fields: name, emailAccountIds, steps",
            });
        }
        const campaign = await (0, campaignService_js_1.createCampaign)({
            ...campaignData,
            userId,
        });
        return res.json({
            success: true,
            campaign,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/campaigns: ${error.message}`);
        return res.status(500).json({
            error: error.message || "Failed to create campaign",
        });
    }
});
/**
 * GET /api/campaigns
 * List all campaigns for the authenticated user
 */
app.get("/api/campaigns", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const campaigns = await (0, campaignService_js_1.listUserCampaigns)(userId);
        return res.json({
            success: true,
            campaigns,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/campaigns: ${error.message}`);
        return res.status(500).json({
            error: error.message || "Failed to fetch campaigns",
        });
    }
});
/**
 * GET /api/campaigns/:id
 * Get a specific campaign
 */
app.get("/api/campaigns/:id", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!id) {
            return res.status(400).json({ error: "Missing campaign ID" });
        }
        const campaign = await (0, campaignService_js_1.getCampaignById)(id, userId);
        return res.json({
            success: true,
            campaign,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/campaigns/:id: ${error.message}`);
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
app.post("/api/campaigns/:id/import-leads", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const filters = req.body;
        if (!id) {
            return res.status(400).json({ error: "Missing campaign ID" });
        }
        const result = await (0, campaignService_js_1.importLeadsFromSearch)(id, userId, filters);
        return res.json({
            success: true,
            leadsImported: result.leadsImported,
            emailsQueued: result.emailsQueued,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/campaigns/:id/import-leads: ${error.message}`);
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
app.post("/api/campaigns/:id/status", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { status } = req.body;
        if (!id) {
            return res.status(400).json({ error: "Missing campaign ID" });
        }
        if (!status) {
            return res.status(400).json({ error: "Missing status" });
        }
        await (0, campaignService_js_1.updateCampaignStatus)(id, userId, status);
        return res.json({
            success: true,
            message: `Campaign status updated to ${status}`,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/campaigns/:id/status: ${error.message}`);
        return res.status(500).json({
            error: error.message || "Failed to update campaign status",
        });
    }
});
/**
 * DELETE /api/campaigns/:id
 * Delete a campaign
 */
app.delete("/api/campaigns/:id", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!id) {
            return res.status(400).json({ error: "Missing campaign ID" });
        }
        await (0, campaignService_js_1.deleteCampaign)(id, userId);
        return res.json({
            success: true,
            message: "Campaign deleted",
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/campaigns/:id: ${error.message}`);
        return res.status(500).json({
            error: error.message || "Failed to delete campaign",
        });
    }
});
/**
 * GET /api/campaigns/:id/stats
 * Get campaign statistics
 */
app.get("/api/campaigns/:id/stats", authMiddleware_js_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!id) {
            return res.status(400).json({ error: "Missing campaign ID" });
        }
        // Verify ownership
        await (0, campaignService_js_1.getCampaignById)(id, userId);
        const stats = await (0, emailSendingService_js_1.getCampaignStats)(id);
        return res.json({
            success: true,
            stats,
        });
    }
    catch (error) {
        logger_js_1.logger.error(`Error in /api/campaigns/:id/stats: ${error.message}`);
        return res.status(500).json({
            error: error.message || "Failed to fetch campaign stats",
        });
    }
});
function startHttpServer(port) {
    app.listen(port, () => {
        logger_js_1.logger.info(`HTTP server listening on port ${port}`);
    });
}
//# sourceMappingURL=httpServer.js.map