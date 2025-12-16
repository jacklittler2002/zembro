import { prisma } from "../db";
import { logger } from "../logger";

export interface CreateListInput {
  userId: string;
  name: string;
  description?: string;
  color?: string;
}

export interface AddLeadsToListInput {
  listId: string;
  userId: string;
  leads: Array<{
    companyId: string;
    contactId?: string;
    notes?: string;
  }>;
}

/**
 * Create a new list
 */
export async function createList(input: CreateListInput) {
  logger.info("Creating list", {
    userId: input.userId,
    name: input.name,
  });

  const list = await prisma.list.create({
    data: {
      userId: input.userId,
      name: input.name,
      description: input.description || null,
      color: input.color || "#3B82F6", // Default blue
    },
  });

  logger.info("List created successfully", {
    listId: list.id,
    name: list.name,
  });

  return list;
}

/**
 * Get list by ID
 */
export async function getListById(listId: string, userId: string) {
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      userId,
    },
    include: {
      leads: {
        include: {
          company: true,
          contact: true,
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!list) {
    throw new Error("List not found or unauthorized");
  }

  return list;
}

/**
 * List all lists for a user
 */
export async function listUserLists(userId: string) {
  return await prisma.list.findMany({
    where: { userId },
    include: {
      leads: {
        take: 5, // Preview first 5 leads
        include: {
          company: {
            select: {
              name: true,
              domain: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Add leads to a list
 */
export async function addLeadsToList(input: AddLeadsToListInput) {
  const { listId, userId, leads } = input;

  // Verify list ownership
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      userId,
    },
  });

  if (!list) {
    throw new Error("List not found or unauthorized");
  }

  // Add leads (skip duplicates)
  const addedLeads = [];
  
  for (const lead of leads) {
    try {
      const listLead = await prisma.listLead.create({
        data: {
          listId,
          companyId: lead.companyId,
          contactId: lead.contactId || null,
          addedBy: userId,
          notes: lead.notes || null,
        },
      });
      addedLeads.push(listLead);
    } catch (error: any) {
      // Skip duplicates (unique constraint violation)
      if (error.code === "P2002") {
        logger.info("Lead already in list", {
          listId,
          companyId: lead.companyId,
        });
        continue;
      }
      throw error;
    }
  }

  // Update lead count
  await prisma.list.update({
    where: { id: listId },
    data: {
      leadCount: {
        increment: addedLeads.length,
      },
    },
  });

  logger.info("Leads added to list", {
    listId,
    addedCount: addedLeads.length,
    skippedDuplicates: leads.length - addedLeads.length,
  });

  return {
    addedCount: addedLeads.length,
    skippedDuplicates: leads.length - addedLeads.length,
  };
}

/**
 * Remove leads from a list
 */
export async function removeLeadsFromList(
  listId: string,
  userId: string,
  leadIds: string[]
) {
  // Verify list ownership
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      userId,
    },
  });

  if (!list) {
    throw new Error("List not found or unauthorized");
  }

  // Remove leads
  const result = await prisma.listLead.deleteMany({
    where: {
      listId,
      id: { in: leadIds },
    },
  });

  // Update lead count
  await prisma.list.update({
    where: { id: listId },
    data: {
      leadCount: {
        decrement: result.count,
      },
    },
  });

  logger.info("Leads removed from list", {
    listId,
    removedCount: result.count,
  });

  return result.count;
}

/**
 * Update list details
 */
export async function updateList(
  listId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    color?: string;
  }
) {
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      userId,
    },
  });

  if (!list) {
    throw new Error("List not found or unauthorized");
  }

  return await prisma.list.update({
    where: { id: listId },
    data: updates,
  });
}

/**
 * Delete a list
 */
export async function deleteList(listId: string, userId: string) {
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      userId,
    },
  });

  if (!list) {
    throw new Error("List not found or unauthorized");
  }

  await prisma.list.delete({
    where: { id: listId },
  });

  logger.info("List deleted", {
    listId,
    name: list.name,
  });
}

/**
 * Get leads from a list (for campaign import)
 */
export async function getListLeads(listId: string, userId: string) {
  const list = await getListById(listId, userId);

  // Transform to match campaign import format
  return list.leads.map((listLead) => ({
    companyName: listLead.company.name,
    websiteUrl: listLead.company.websiteUrl,
    domain: listLead.company.domain,
    country: listLead.company.country,
    city: listLead.company.city,
    phone: listLead.company.phone,
    industry: listLead.company.industry,
    sizeBucket: listLead.company.sizeBucket,
    businessType: listLead.company.businessType,
    email: listLead.contact?.email || null,
    firstName: listLead.contact?.firstName || null,
    lastName: listLead.contact?.lastName || null,
    role: listLead.contact?.role || null,
    linkedinUrl: listLead.contact?.linkedinUrl || null,
    isLikelyDecisionMaker: listLead.contact?.isLikelyDecisionMaker || false,
  }));
}
