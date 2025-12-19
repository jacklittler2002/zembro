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
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTedTool = executeTedTool;
const tedTools_1 = require("./tedTools");
const enforce_1 = require("../../monetization/enforce");
const leadSearchService_1 = require("../../leadSearch/leadSearchService");
const leadSearchExportService_1 = require("../../export/leadSearchExportService");
const leadListService_1 = require("../../lists/leadListService");
const leadListExportService_1 = require("../../export/leadListExportService");
const logger_1 = require("../../logger");
const creditService_1 = require("../../ted/creditService");
// Billing checkout URL helpers
const billingService_1 = require("../../billing/billingService");
const getPlan_1 = require("../../monetization/getPlan");
async function executeTedTool(args) {
    const { userId, name, rawArgs } = args;
    // Validate inputs
    const schema = (0, tedTools_1.getToolSchema)(name);
    const parsed = schema.safeParse(rawArgs);
    if (!parsed.success) {
        return {
            ok: false,
            error: "INVALID_TOOL_ARGS",
            details: parsed.error.flatten(),
        };
    }
    const input = parsed.data;
    switch (name) {
        case "check_credits": {
            const balance = await (0, creditService_1.getCreditBalance)(userId);
            return { ok: true, balance };
        }
        case "estimate_credits": {
            const { action, quantity } = input;
            // Use CREDIT_PRICING from monetization config
            const { CREDIT_PRICING } = await Promise.resolve().then(() => __importStar(require("../../monetization/pricing")));
            const unitCost = action === "TED_MESSAGE" ? CREDIT_PRICING.TED_MESSAGE :
                action === "DISCOVERY" ? CREDIT_PRICING.LEAD_SEARCH_START :
                    action === "CRAWL" ? CREDIT_PRICING.CRAWL_COMPANY :
                        action === "ENRICH" ? CREDIT_PRICING.ENRICH_COMPANY :
                            CREDIT_PRICING.EXPORT_CONTACT;
            const estimated = Number(unitCost) * Number(quantity);
            return { ok: true, estimated };
        }
        case "start_lead_search": {
            // This "action" is valuable; we can choose to charge for it (optional).
            // For now: charge DISCOVERY cost once at creation-time.
            const { CREDIT_PRICING } = await Promise.resolve().then(() => __importStar(require("../../monetization/pricing")));
            try {
                await (0, enforce_1.requireCredits)(userId, CREDIT_PRICING.LEAD_SEARCH_START, "LEAD_SEARCH_START");
            }
            catch (err) {
                if (err.code === "INSUFFICIENT_CREDITS") {
                    return {
                        ok: false,
                        error: "INSUFFICIENT_CREDITS",
                        required: err.details.required,
                        available: err.details.available,
                        suggestion: "upgrade_or_topup",
                    };
                }
                throw err;
            }
            const leadSearch = await (0, leadSearchService_1.createLeadSearch)({
                userId,
                query: input.query,
                maxLeads: input.maxLeads,
            });
            return {
                ok: true,
                leadSearchId: leadSearch.id,
                status: leadSearch.status,
                message: "Lead search started. Crawling & enrichment will continue in the background.",
            };
        }
        case "get_lead_search_status": {
            const ls = await (0, leadSearchService_1.getLeadSearchById)(input.leadSearchId);
            if (!ls)
                return { ok: false, error: "NOT_FOUND" };
            if (ls.userId && ls.userId !== userId)
                return { ok: false, error: "FORBIDDEN" };
            return { ok: true, leadSearch: ls };
        }
        case "preview_leads": {
            const ls = await (0, leadSearchService_1.getLeadSearchById)(input.leadSearchId);
            if (!ls)
                return { ok: false, error: "NOT_FOUND" };
            if (ls.userId && ls.userId !== userId)
                return { ok: false, error: "FORBIDDEN" };
            const plan = await (0, getPlan_1.getUserPlanCode)(userId);
            const ent = (0, enforce_1.getEntitlements)(plan);
            const previewCap = plan === "FREE" ? 50 : ent.maxExportContactsPerExport;
            const leads = await (0, leadSearchService_1.getLeadSearchLeads)(input.leadSearchId, {
                limit: Math.min(input.limit, previewCap) || previewCap,
                minScore: input.filters?.minScore,
                industry: input.filters?.industry,
                sizeBucket: input.filters?.sizeBucket,
                country: input.filters?.country,
                decisionMakerOnly: input.filters?.decisionMakerOnly,
            });
            return { ok: true, count: leads.length, leads, previewCap };
        }
        case "export_leads_csv": {
            const ls = await (0, leadSearchService_1.getLeadSearchById)(input.leadSearchId);
            if (!ls)
                return { ok: false, error: "NOT_FOUND" };
            if (ls.userId && ls.userId !== userId)
                return { ok: false, error: "FORBIDDEN" };
            const plan = await (0, getPlan_1.getUserPlanCode)(userId);
            const ent = (0, enforce_1.getEntitlements)(plan);
            const leads = await (0, leadSearchService_1.getLeadSearchLeads)(input.leadSearchId, {
                limit: (0, enforce_1.clampByPlan)(plan, ls.maxLeads ?? 100, "maxExportContactsPerExport") + 1,
                minScore: input.filters?.minScore,
                industry: input.filters?.industry,
                sizeBucket: input.filters?.sizeBucket,
                country: input.filters?.country,
                decisionMakerOnly: input.filters?.decisionMakerOnly,
            });
            if (leads.length > ent.maxExportContactsPerExport) {
                const upgradeUrl = await (0, billingService_1.createSubscriptionCheckoutUrl)(userId, "GROWTH");
                return {
                    ok: false,
                    error: "UPGRADE_REQUIRED",
                    limit: "maxExportContactsPerExport",
                    allowed: ent.maxExportContactsPerExport,
                    plan,
                    upgradeUrl,
                };
            }
            try {
                await (0, enforce_1.requireCredits)(userId, leads.length, "EXPORT_CONTACT");
            }
            catch (err) {
                if (err.code === "INSUFFICIENT_CREDITS") {
                    const topupUrl = await (0, billingService_1.createCreditPackCheckoutUrl)(userId, "5K");
                    return {
                        ok: false,
                        error: "INSUFFICIENT_CREDITS",
                        required: err.details.required,
                        available: err.details.available,
                        estimatedExportContacts: leads.length,
                        suggestion: "upgrade_or_topup",
                        checkoutUrl: topupUrl,
                    };
                }
                throw err;
            }
            const csv = await (0, leadSearchExportService_1.exportLeadSearchToCsv)(input.leadSearchId, userId);
            return { ok: true, contactsExported: leads.length, csv };
        }
        case "create_subscription_checkout": {
            const url = await (0, billingService_1.createSubscriptionCheckoutUrl)(userId, input.planCode);
            return { ok: true, url };
        }
        case "create_credit_pack_checkout": {
            const url = await (0, billingService_1.createCreditPackCheckoutUrl)(userId, input.packCode);
            return { ok: true, url };
        }
        case "create_list": {
            const list = await (0, leadListService_1.createLeadList)(userId, {
                name: input.name,
                description: input.description,
            });
            return { ok: true, listId: list.id, list };
        }
        case "list_lists": {
            const lists = await (0, leadListService_1.listLeadLists)(userId);
            return {
                ok: true,
                lists: lists.map((l) => ({ id: l.id, name: l.name, description: l.description ?? null, items: l._count?.items ?? 0 })),
            };
        }
        case "add_from_search_to_list": {
            const result = await (0, leadListService_1.addLeadsFromLeadSearch)(userId, {
                leadListId: input.leadListId,
                leadSearchId: input.leadSearchId,
                limit: input.limit,
                filters: input.filters,
            });
            return { ok: true, added: result.added, totalCandidates: result.totalCandidates };
        }
        case "export_list_csv": {
            try {
                const { csv } = await (0, leadListExportService_1.exportLeadListToCsv)(userId, input.leadListId);
                return { ok: true, csv };
            }
            catch (err) {
                if (err?.code === "INSUFFICIENT_CREDITS") {
                    const topupUrl = await (0, billingService_1.createCreditPackCheckoutUrl)(userId, "5K");
                    return {
                        ok: false,
                        error: "INSUFFICIENT_CREDITS",
                        required: err.required,
                        available: err.available,
                        contacts: err.contacts,
                        checkoutUrl: topupUrl,
                    };
                }
                if (err?.code === "UPGRADE_REQUIRED") {
                    const upgradeUrl = await (0, billingService_1.createSubscriptionCheckoutUrl)(userId, "GROWTH");
                    return {
                        ok: false,
                        error: "UPGRADE_REQUIRED",
                        limit: err.limit,
                        allowed: err.allowed,
                        plan: err.plan,
                        upgradeUrl,
                    };
                }
                return { ok: false, error: "EXPORT_FAILED" };
            }
        }
        default:
            logger_1.logger.warn("Unknown TED tool", { name });
            return { ok: false, error: "UNKNOWN_TOOL" };
    }
}
//# sourceMappingURL=executeTool.js.map