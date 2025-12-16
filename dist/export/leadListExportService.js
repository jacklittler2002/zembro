"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLeadListToCsv = exportLeadListToCsv;
const db_1 = require("../db");
const csvExport_1 = require("./csvExport");
const creditService_1 = require("../ted/creditService");
const creditPricing_1 = require("../billing/creditPricing");
const getUserPlan_1 = require("../billing/getUserPlan");
const planLimits_1 = require("../billing/planLimits");
async function exportLeadListToCsv(userId, leadListId) {
    const list = await db_1.prisma.leadList.findFirst({
        where: { id: leadListId, userId },
        include: { items: true },
    });
    if (!list)
        throw new Error("Lead list not found");
    const contacts = list.items.filter((i) => !!i.email).length;
    const plan = await (0, getUserPlan_1.getUserPlanCode)(userId);
    const limits = planLimits_1.PLAN_LIMITS[plan];
    if (contacts > limits.maxExportContactsPerExport) {
        const err = new Error("UPGRADE_REQUIRED");
        err.code = "UPGRADE_REQUIRED";
        err.limit = "maxExportContactsPerExport";
        err.allowed = limits.maxExportContactsPerExport;
        err.plan = plan;
        throw err;
    }
    const required = Math.ceil(contacts * creditPricing_1.CREDIT_COSTS.EXPORT_PER_CONTACT);
    const balance = await (0, creditService_1.getCreditBalance)(userId);
    if (balance < required) {
        const err = new Error("INSUFFICIENT_CREDITS");
        err.code = "INSUFFICIENT_CREDITS";
        err.required = required;
        err.available = balance;
        err.contacts = contacts;
        throw err;
    }
    await (0, creditService_1.consumeCredits)(userId, required, "LEAD_EXPORT");
    const rows = list.items.map((i) => ({
        email: i.email ?? "",
        first_name: i.firstName ?? "",
        last_name: i.lastName ?? "",
        company: i.companyName ?? "",
        website: i.websiteUrl ?? "",
        city: i.city ?? "",
        country: i.country ?? "",
        niche: "",
        industry: i.industry ?? "",
        size_bucket: i.sizeBucket ?? "",
        role: i.role ?? "",
        decision_maker: "",
    }));
    return { csv: (0, csvExport_1.leadsToCsv)(rows), contacts };
}
//# sourceMappingURL=leadListExportService.js.map