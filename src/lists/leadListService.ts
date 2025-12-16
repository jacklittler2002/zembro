import { prisma } from "../db";
import { logger } from "../logger";

export async function createLeadList(userId: string, input: { name: string; description?: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("List name is required");

  const list = await prisma.leadList.create({
    data: {
      userId,
      name,
      description: input.description?.trim() || null,
    },
  });

  logger.info("Created lead list", { userId, listId: list.id, name });
  return list;
}

export async function listLeadLists(userId: string) {
  return prisma.leadList.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function getLeadList(userId: string, id: string) {
  return prisma.leadList.findFirst({
    where: { id, userId },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        include: {
          company: { select: { id: true, name: true, domain: true, industry: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        },
      },
    },
  });
}

export async function addLeadsFromLeadSearch(userId: string, args: {
  leadListId: string;
  leadSearchId: string;
  limit?: number;
  filters?: {
    minScore?: number;
    industry?: string;
    sizeBucket?: string;
    country?: string;
    decisionMakerOnly?: boolean;
  };
}) {
  const leadList = await prisma.leadList.findFirst({
    where: { id: args.leadListId, userId },
  });
  if (!leadList) throw new Error("Lead list not found");

  const { getLeadSearchLeads } = await import("../leadSearch/leadSearchService");
  const options: any = { limit: args.limit ?? 200 };
  if (args.filters?.minScore !== undefined) options.minScore = args.filters.minScore;
  if (args.filters?.industry !== undefined) options.industry = args.filters.industry;
  if (args.filters?.sizeBucket !== undefined) options.sizeBucket = args.filters.sizeBucket as any;
  if (args.filters?.country !== undefined) options.country = args.filters.country;
  if (args.filters?.decisionMakerOnly !== undefined) options.decisionMakerOnly = args.filters.decisionMakerOnly;
  const leads = await getLeadSearchLeads(args.leadSearchId, options);

  const existing = await prisma.leadListItem.findMany({
    where: { leadListId: leadList.id },
    select: { email: true, companyName: true },
  });
  const existingKey = new Set(existing.map((e) => `${e.email || ""}|${e.companyName}`));

  const itemsToCreate: any[] = [];
  for (const lead of leads) {
    const key = `${lead.email || ""}|${lead.companyName}`;
    if (existingKey.has(key)) continue;

    const company = await prisma.company.findFirst({
      where: { name: lead.companyName },
      select: { id: true },
    });
    const contact = lead.email
      ? await prisma.contact.findFirst({
          where: { email: lead.email },
          select: { id: true },
        })
      : null;

    itemsToCreate.push({
      leadListId: leadList.id,
      companyId: company?.id ?? (await fallbackCompanyId(lead.companyName)),
      contactId: contact?.id ?? null,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      role: (lead as any).role ?? null,
      companyName: lead.companyName,
      websiteUrl: lead.websiteUrl,
      country: lead.country,
      city: lead.city,
      industry: (lead as any).industry ?? null,
      sizeBucket: (lead as any).sizeBucket ?? null,
      score: lead.score ?? null,
    });
  }

  if (itemsToCreate.length) {
    await prisma.leadListItem.createMany({ data: itemsToCreate });
  }

  await prisma.leadList.update({
    where: { id: leadList.id },
    data: { updatedAt: new Date() },
  });

  return { added: itemsToCreate.length, totalCandidates: leads.length };
}

async function fallbackCompanyId(companyName: string): Promise<string> {
  const company = await prisma.company.create({
    data: {
      name: companyName,
      domain: null,
      source: "list_snapshot",
    },
  });
  return company.id;
}

export async function updateLeadList(
  userId: string,
  id: string,
  updates: { name?: string; description?: string | null }
) {
  const list = await prisma.leadList.findFirst({ where: { id, userId } });
  if (!list) throw new Error("Lead list not found");

  const data: any = {};
  if (typeof updates.name === "string") data.name = updates.name.trim();
  if (typeof updates.description !== "undefined") data.description = updates.description?.trim() || null;

  return prisma.leadList.update({ where: { id }, data });
}

export async function deleteLeadList(userId: string, id: string) {
  const list = await prisma.leadList.findFirst({ where: { id, userId }, select: { id: true } });
  if (!list) throw new Error("Lead list not found");

  await prisma.leadListItem.deleteMany({ where: { leadListId: id } });
  await prisma.leadList.delete({ where: { id } });
  return { success: true };
}

export async function removeLeadListItems(userId: string, leadListId: string, itemIds: string[]) {
  const list = await prisma.leadList.findFirst({ where: { id: leadListId, userId }, select: { id: true } });
  if (!list) throw new Error("Lead list not found");
  const result = await prisma.leadListItem.deleteMany({ where: { id: { in: itemIds }, leadListId } });
  return { removed: result.count };
}
