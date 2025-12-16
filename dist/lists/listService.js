"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createList = createList;
exports.getListById = getListById;
exports.listUserLists = listUserLists;
exports.addLeadsToList = addLeadsToList;
exports.removeLeadsFromList = removeLeadsFromList;
exports.updateList = updateList;
exports.deleteList = deleteList;
exports.getListLeads = getListLeads;
const db_1 = require("../db");
const logger_1 = require("../logger");
/**
 * Create a new list
 */
async function createList(input) {
    logger_1.logger.info("Creating list", {
        userId: input.userId,
        name: input.name,
    });
    const list = await db_1.prisma.list.create({
        data: {
            userId: input.userId,
            name: input.name,
            description: input.description || null,
            color: input.color || "#3B82F6", // Default blue
        },
    });
    logger_1.logger.info("List created successfully", {
        listId: list.id,
        name: list.name,
    });
    return list;
}
/**
 * Get list by ID
 */
async function getListById(listId, userId) {
    const list = await db_1.prisma.list.findFirst({
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
async function listUserLists(userId) {
    return await db_1.prisma.list.findMany({
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
async function addLeadsToList(input) {
    const { listId, userId, leads } = input;
    // Verify list ownership
    const list = await db_1.prisma.list.findFirst({
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
            const listLead = await db_1.prisma.listLead.create({
                data: {
                    listId,
                    companyId: lead.companyId,
                    contactId: lead.contactId || null,
                    addedBy: userId,
                    notes: lead.notes || null,
                },
            });
            addedLeads.push(listLead);
        }
        catch (error) {
            // Skip duplicates (unique constraint violation)
            if (error.code === "P2002") {
                logger_1.logger.info("Lead already in list", {
                    listId,
                    companyId: lead.companyId,
                });
                continue;
            }
            throw error;
        }
    }
    // Update lead count
    await db_1.prisma.list.update({
        where: { id: listId },
        data: {
            leadCount: {
                increment: addedLeads.length,
            },
        },
    });
    logger_1.logger.info("Leads added to list", {
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
async function removeLeadsFromList(listId, userId, leadIds) {
    // Verify list ownership
    const list = await db_1.prisma.list.findFirst({
        where: {
            id: listId,
            userId,
        },
    });
    if (!list) {
        throw new Error("List not found or unauthorized");
    }
    // Remove leads
    const result = await db_1.prisma.listLead.deleteMany({
        where: {
            listId,
            id: { in: leadIds },
        },
    });
    // Update lead count
    await db_1.prisma.list.update({
        where: { id: listId },
        data: {
            leadCount: {
                decrement: result.count,
            },
        },
    });
    logger_1.logger.info("Leads removed from list", {
        listId,
        removedCount: result.count,
    });
    return result.count;
}
/**
 * Update list details
 */
async function updateList(listId, userId, updates) {
    const list = await db_1.prisma.list.findFirst({
        where: {
            id: listId,
            userId,
        },
    });
    if (!list) {
        throw new Error("List not found or unauthorized");
    }
    return await db_1.prisma.list.update({
        where: { id: listId },
        data: updates,
    });
}
/**
 * Delete a list
 */
async function deleteList(listId, userId) {
    const list = await db_1.prisma.list.findFirst({
        where: {
            id: listId,
            userId,
        },
    });
    if (!list) {
        throw new Error("List not found or unauthorized");
    }
    await db_1.prisma.list.delete({
        where: { id: listId },
    });
    logger_1.logger.info("List deleted", {
        listId,
        name: list.name,
    });
}
/**
 * Get leads from a list (for campaign import)
 */
async function getListLeads(listId, userId) {
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
//# sourceMappingURL=listService.js.map