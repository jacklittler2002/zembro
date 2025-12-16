import { prisma } from "../db";
import { leadsToCsv, CsvLeadRow } from "./csvExport";
import { getUserPlanCode } from "../monetization/getPlan";

import { clampByPlan, requireCredits, getEntitlements, PlanLimitError, InsufficientCreditsError } from "../monetization/enforce";

export async function exportLeadListToCsv(leadListId: string, userId: string) {
  const list = await prisma.leadList.findFirst({
    where: { id: leadListId, userId },
    include: { items: true },
  });
  if (!list) throw new Error("Lead list not found");

  const contacts = list.items.filter((i) => !!i.email).length;
  const plan = await getUserPlanCode(userId);
  const ent = getEntitlements(plan);
  const cappedContacts = clampByPlan(plan, contacts, "maxExportContactsPerExport");
  if (contacts > ent.maxExportContactsPerExport) {
    throw new PlanLimitError({ limit: "maxExportContactsPerExport", allowed: ent.maxExportContactsPerExport, plan });
  }
  const required = cappedContacts; // CREDIT_PRICING.EXPORT_CONTACT is 1 per contact
  await requireCredits(userId, required, "EXPORT_CONTACT");

  const rows: CsvLeadRow[] = list.items.map((i) => ({
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

  return { csv: leadsToCsv(rows), contacts };
}

