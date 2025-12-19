import { TedToolName, getToolSchema } from "./tedTools";
import { requireCredits, clampByPlan, getEntitlements } from "../../monetization/enforce";
import { createLeadSearch, getLeadSearchById, getLeadSearchLeads } from "../../leadSearch/leadSearchService";
import { exportLeadSearchToCsv } from "../../export/leadSearchExportService";
import { createLeadList, listLeadLists, addLeadsFromLeadSearch } from "../../lists/leadListService";
import { exportLeadListToCsv } from "../../export/leadListExportService";
import { logger } from "../../logger";
import { getCreditBalance } from "../../ted/creditService";

// Billing checkout URL helpers
import { createSubscriptionCheckoutUrl, createCreditPackCheckoutUrl } from "../../billing/billingService";
import { getUserPlanCode } from "../../monetization/getPlan";

export async function executeTedTool(args: {
  userId: string;
  name: TedToolName;
  rawArgs: any;
}) {
  const { userId, name, rawArgs } = args;

  // Validate inputs
  const schema = getToolSchema(name);
  const parsed = schema.safeParse(rawArgs);
  if (!parsed.success) {
    return {
      ok: false,
      error: "INVALID_TOOL_ARGS",
      details: parsed.error.flatten(),
    };
  }

  const input = parsed.data as any;

  switch (name) {
    case "check_credits": {
      const balance = await getCreditBalance(userId);
      return { ok: true, balance };
    }

    case "estimate_credits": {
      const { action, quantity } = input;
      // Use CREDIT_PRICING from monetization config
      const { CREDIT_PRICING } = await import("../../monetization/pricing");
      const unitCost =
        action === "TED_MESSAGE" ? CREDIT_PRICING.TED_MESSAGE :
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
      const { CREDIT_PRICING } = await import("../../monetization/pricing");
      try {
        await requireCredits(userId, CREDIT_PRICING.LEAD_SEARCH_START, "LEAD_SEARCH_START");
      } catch (err: any) {
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

      const leadSearch = await createLeadSearch({
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
      const ls = await getLeadSearchById(input.leadSearchId);
      if (!ls) return { ok: false, error: "NOT_FOUND" };
      if (ls.userId && ls.userId !== userId) return { ok: false, error: "FORBIDDEN" };

      return { ok: true, leadSearch: ls };
    }

    case "preview_leads": {
      const ls = await getLeadSearchById(input.leadSearchId);
      if (!ls) return { ok: false, error: "NOT_FOUND" };
      if (ls.userId && ls.userId !== userId) return { ok: false, error: "FORBIDDEN" };

      const plan = await getUserPlanCode(userId);
      const ent = getEntitlements(plan);
      const previewCap = plan === "FREE" ? 50 : ent.maxExportContactsPerExport;
      const leads = await getLeadSearchLeads(input.leadSearchId, {
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
      const ls = await getLeadSearchById(input.leadSearchId);
      if (!ls) return { ok: false, error: "NOT_FOUND" };
      if (ls.userId && ls.userId !== userId) return { ok: false, error: "FORBIDDEN" };

      const plan = await getUserPlanCode(userId);
      const ent = getEntitlements(plan);
      const leads = await getLeadSearchLeads(input.leadSearchId, {
        limit: clampByPlan(plan, ls.maxLeads ?? 100, "maxExportContactsPerExport") + 1,
        minScore: input.filters?.minScore,
        industry: input.filters?.industry,
        sizeBucket: input.filters?.sizeBucket,
        country: input.filters?.country,
        decisionMakerOnly: input.filters?.decisionMakerOnly,
      });
      if (leads.length > ent.maxExportContactsPerExport) {
        const upgradeUrl = await createSubscriptionCheckoutUrl(userId, "GROWTH");
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
        await requireCredits(userId, leads.length, "EXPORT_CONTACT");
      } catch (err: any) {
        if (err.code === "INSUFFICIENT_CREDITS") {
          const topupUrl = await createCreditPackCheckoutUrl(userId, "5K");
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
      const csv = await exportLeadSearchToCsv(input.leadSearchId, userId);
      return { ok: true, contactsExported: leads.length, csv };
    }

    case "create_subscription_checkout": {
      const url = await createSubscriptionCheckoutUrl(userId, input.planCode);
      return { ok: true, url };
    }

    case "create_credit_pack_checkout": {
      const url = await createCreditPackCheckoutUrl(userId, input.packCode);
      return { ok: true, url };
    }

    case "create_list": {
      const list = await createLeadList(userId, {
        name: input.name,
        description: input.description,
      });
      return { ok: true, listId: list.id, list };
    }

    case "list_lists": {
      const lists = await listLeadLists(userId);
      return {
        ok: true,
        lists: lists.map((l: any) => ({ id: l.id, name: l.name, description: l.description ?? null, items: l._count?.items ?? 0 })),
      };
    }

    case "add_from_search_to_list": {
      const result = await addLeadsFromLeadSearch(userId, {
        leadListId: input.leadListId,
        leadSearchId: input.leadSearchId,
        limit: input.limit,
        filters: input.filters,
      });
      return { ok: true, added: result.added, totalCandidates: result.totalCandidates };
    }

    case "export_list_csv": {
      try {
        const { csv } = await exportLeadListToCsv(userId, input.leadListId);
        return { ok: true, csv };
      } catch (err: any) {
        if (err?.code === "INSUFFICIENT_CREDITS") {
          const topupUrl = await createCreditPackCheckoutUrl(userId, "5K");
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
          const upgradeUrl = await createSubscriptionCheckoutUrl(userId, "GROWTH");
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
      logger.warn("Unknown TED tool", { name });
      return { ok: false, error: "UNKNOWN_TOOL" };
  }
}
