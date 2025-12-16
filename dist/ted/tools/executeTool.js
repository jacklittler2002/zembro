"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTedTool = executeTedTool;
const tedTools_js_1 = require("./tedTools.js");
const creditPricing_js_1 = require("../../billing/creditPricing.js");
const creditService_js_1 = require("../creditService.js");
const leadSearchService_js_1 = require("../../leadSearch/leadSearchService.js");
const leadSearchExportService_js_1 = require("../../export/leadSearchExportService.js");
const leadListService_js_1 = require("../../lists/leadListService.js");
const leadListExportService_js_1 = require("../../export/leadListExportService.js");
const logger_js_1 = require("../../logger.js");
// Billing checkout URL helpers
const billingService_js_1 = require("../../billing/billingService.js");
const planLimits_js_1 = require("../../billing/planLimits.js");
const getUserPlan_js_1 = require("../../billing/getUserPlan.js");
async function executeTedTool(args) {
    const { userId, name, rawArgs } = args;
    // Validate inputs
    const schema = (0, tedTools_js_1.getToolSchema)(name);
    const parsed = schema.safeParse(rawArgs);
    if (!parsed.success) {
        return {
            ok: false,
            error: "INVALID_TOOL_ARGS",
            details: parsed.error.flatten(),
        };
    }
    const input = parsed.data;
    // Helpers
    async function softCreditCheck(required) {
        const balance = await (0, creditService_js_1.getCreditBalance)(userId);
        return {
            required,
            available: balance,
            ok: balance >= required,
        };
    }
    switch (name) {
        case "check_credits": {
            const balance = await (0, creditService_js_1.getCreditBalance)(userId);
            return { ok: true, balance };
        }
        case "estimate_credits": {
            const { action, quantity } = input;
            const unitCost = action === "TED_MESSAGE" ? creditPricing_js_1.CREDIT_COSTS.TED_MESSAGE :
                action === "DISCOVERY" ? creditPricing_js_1.CREDIT_COSTS.DISCOVERY :
                    action === "CRAWL" ? creditPricing_js_1.CREDIT_COSTS.CRAWL :
                        action === "ENRICH" ? creditPricing_js_1.CREDIT_COSTS.ENRICH :
                            creditPricing_js_1.CREDIT_COSTS.EXPORT_PER_CONTACT;
            const estimated = Number(unitCost) * Number(quantity);
            return { ok: true, estimated };
        }
        case "start_lead_search": {
            // This "action" is valuable; we can choose to charge for it (optional).
            // For now: charge DISCOVERY cost once at creation-time.
            const required = creditPricing_js_1.CREDIT_COSTS.DISCOVERY;
            const check = await softCreditCheck(required);
            if (!check.ok) {
                return {
                    ok: false,
                    error: "INSUFFICIENT_CREDITS",
                    required: check.required,
                    available: check.available,
                    suggestion: "upgrade_or_topup",
                };
            }
            await (0, creditService_js_1.consumeCredits)(userId, required, "DISCOVERY");
            const leadSearch = await (0, leadSearchService_js_1.createLeadSearch)({
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
            const ls = await (0, leadSearchService_js_1.getLeadSearchById)(input.leadSearchId);
            if (!ls)
                return { ok: false, error: "NOT_FOUND" };
            if (ls.userId && ls.userId !== userId)
                return { ok: false, error: "FORBIDDEN" };
            return { ok: true, leadSearch: ls };
        }
        case "preview_leads": {
            const ls = await (0, leadSearchService_js_1.getLeadSearchById)(input.leadSearchId);
            if (!ls)
                return { ok: false, error: "NOT_FOUND" };
            if (ls.userId && ls.userId !== userId)
                return { ok: false, error: "FORBIDDEN" };
            const plan = await (0, getUserPlan_js_1.getUserPlanCode)(userId);
            const limits = planLimits_js_1.PLAN_LIMITS[plan];
            const leads = await (0, leadSearchService_js_1.getLeadSearchLeads)(input.leadSearchId, {
                limit: Math.min(input.limit, limits.maxExportContactsPerExport) || limits.maxExportContactsPerExport,
                minScore: input.filters?.minScore,
                industry: input.filters?.industry,
                sizeBucket: input.filters?.sizeBucket,
                country: input.filters?.country,
                decisionMakerOnly: input.filters?.decisionMakerOnly,
            });
            return { ok: true, count: leads.length, leads };
        }
        case "export_leads_csv": {
            const ls = await (0, leadSearchService_js_1.getLeadSearchById)(input.leadSearchId);
            if (!ls)
                return { ok: false, error: "NOT_FOUND" };
            if (ls.userId && ls.userId !== userId)
                return { ok: false, error: "FORBIDDEN" };
            const plan = await (0, getUserPlan_js_1.getUserPlanCode)(userId);
            const limits = planLimits_js_1.PLAN_LIMITS[plan];
            // We charge export per-contact (soft wall)
            const leads = await (0, leadSearchService_js_1.getLeadSearchLeads)(input.leadSearchId, {
                limit: Math.min(ls.maxLeads ?? 100, limits.maxExportContactsPerExport + 1),
                minScore: input.filters?.minScore,
                industry: input.filters?.industry,
                sizeBucket: input.filters?.sizeBucket,
                country: input.filters?.country,
                decisionMakerOnly: input.filters?.decisionMakerOnly,
            });
            if (leads.length > limits.maxExportContactsPerExport) {
                const upgradeUrl = await (0, billingService_js_1.createSubscriptionCheckoutUrl)(userId, "GROWTH");
                return {
                    ok: false,
                    error: "UPGRADE_REQUIRED",
                    limit: "maxExportContactsPerExport",
                    allowed: limits.maxExportContactsPerExport,
                    plan,
                    upgradeUrl,
                };
            }
            const required = Math.ceil(leads.length * creditPricing_js_1.CREDIT_COSTS.EXPORT_PER_CONTACT);
            const check = await softCreditCheck(required);
            if (!check.ok) {
                const topupUrl = await (0, billingService_js_1.createCreditPackCheckoutUrl)(userId, "5K");
                return {
                    ok: false,
                    error: "INSUFFICIENT_CREDITS",
                    required: check.required,
                    available: check.available,
                    estimatedExportContacts: leads.length,
                    suggestion: "upgrade_or_topup",
                    checkoutUrl: topupUrl,
                };
            }
            await (0, creditService_js_1.consumeCredits)(userId, required, "LEAD_EXPORT");
            // Export service can be updated later to accept filters. For now: it exports whatever getLeadSearchLeads returns.
            const csv = await (0, leadSearchExportService_js_1.exportLeadSearchToCsv)(input.leadSearchId, userId);
            return { ok: true, contactsExported: leads.length, csv };
        }
        case "create_subscription_checkout": {
            const url = await (0, billingService_js_1.createSubscriptionCheckoutUrl)(userId, input.planCode);
            return { ok: true, url };
        }
        case "create_credit_pack_checkout": {
            const url = await (0, billingService_js_1.createCreditPackCheckoutUrl)(userId, input.packCode);
            return { ok: true, url };
        }
        case "create_list": {
            const list = await (0, leadListService_js_1.createLeadList)(userId, {
                name: input.name,
                description: input.description,
            });
            return { ok: true, listId: list.id, list };
        }
        case "list_lists": {
            const lists = await (0, leadListService_js_1.listLeadLists)(userId);
            return {
                ok: true,
                lists: lists.map((l) => ({ id: l.id, name: l.name, description: l.description ?? null, items: l._count?.items ?? 0 })),
            };
        }
        case "add_from_search_to_list": {
            const result = await (0, leadListService_js_1.addLeadsFromLeadSearch)(userId, {
                leadListId: input.leadListId,
                leadSearchId: input.leadSearchId,
                limit: input.limit,
                filters: input.filters,
            });
            return { ok: true, added: result.added, totalCandidates: result.totalCandidates };
        }
        case "export_list_csv": {
            try {
                const { csv } = await (0, leadListExportService_js_1.exportLeadListToCsv)(userId, input.leadListId);
                return { ok: true, csv };
            }
            catch (err) {
                if (err?.code === "INSUFFICIENT_CREDITS") {
                    const topupUrl = await (0, billingService_js_1.createCreditPackCheckoutUrl)(userId, "5K");
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
                    const upgradeUrl = await (0, billingService_js_1.createSubscriptionCheckoutUrl)(userId, "GROWTH");
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
            logger_js_1.logger.warn("Unknown TED tool", { name });
            return { ok: false, error: "UNKNOWN_TOOL" };
    }
}
//# sourceMappingURL=executeTool.js.map