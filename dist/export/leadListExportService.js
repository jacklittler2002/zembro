"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLeadListToCsv = exportLeadListToCsv;
const db_1 = require("../db");
const csvExport_1 = require("./csvExport");
const getPlan_1 = require("../monetization/getPlan");
const enforce_1 = require("../monetization/enforce");
async function exportLeadListToCsv(leadListId, userId) {
    const list = await db_1.prisma.leadList.findFirst({
        where: { id: leadListId, userId },
        include: { items: true },
    });
    if (!list)
        throw new Error("Lead list not found");
    const contacts = list.items.filter((i) => !!i.email).length;
    const plan = await (0, getPlan_1.getUserPlanCode)(userId);
    const ent = (0, enforce_1.getEntitlements)(plan);
    const cappedContacts = (0, enforce_1.clampByPlan)(plan, contacts, "maxExportContactsPerExport");
    if (contacts > ent.maxExportContactsPerExport) {
        throw new enforce_1.PlanLimitError({ limit: "maxExportContactsPerExport", allowed: ent.maxExportContactsPerExport, plan });
    }
    const required = cappedContacts; // CREDIT_PRICING.EXPORT_CONTACT is 1 per contact
    await (0, enforce_1.requireCredits)(userId, required, "EXPORT_CONTACT");
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