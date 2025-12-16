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
exports.createLeadList = createLeadList;
exports.listLeadLists = listLeadLists;
exports.getLeadList = getLeadList;
exports.addLeadsFromLeadSearch = addLeadsFromLeadSearch;
exports.updateLeadList = updateLeadList;
exports.deleteLeadList = deleteLeadList;
exports.removeLeadListItems = removeLeadListItems;
const db_1 = require("../db");
const logger_1 = require("../logger");
async function createLeadList(userId, input) {
    const name = input.name.trim();
    if (!name)
        throw new Error("List name is required");
    const list = await db_1.prisma.leadList.create({
        data: {
            userId,
            name,
            description: input.description?.trim() || null,
        },
    });
    logger_1.logger.info("Created lead list", { userId, listId: list.id, name });
    return list;
}
async function listLeadLists(userId) {
    return db_1.prisma.leadList.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { items: true } } },
    });
}
async function getLeadList(userId, id) {
    return db_1.prisma.leadList.findFirst({
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
async function addLeadsFromLeadSearch(userId, args) {
    const leadList = await db_1.prisma.leadList.findFirst({
        where: { id: args.leadListId, userId },
    });
    if (!leadList)
        throw new Error("Lead list not found");
    const { getLeadSearchLeads } = await Promise.resolve().then(() => __importStar(require("../leadSearch/leadSearchService")));
    const options = { limit: args.limit ?? 200 };
    if (args.filters?.minScore !== undefined)
        options.minScore = args.filters.minScore;
    if (args.filters?.industry !== undefined)
        options.industry = args.filters.industry;
    if (args.filters?.sizeBucket !== undefined)
        options.sizeBucket = args.filters.sizeBucket;
    if (args.filters?.country !== undefined)
        options.country = args.filters.country;
    if (args.filters?.decisionMakerOnly !== undefined)
        options.decisionMakerOnly = args.filters.decisionMakerOnly;
    const leads = await getLeadSearchLeads(args.leadSearchId, options);
    const existing = await db_1.prisma.leadListItem.findMany({
        where: { leadListId: leadList.id },
        select: { email: true, companyName: true },
    });
    const existingKey = new Set(existing.map((e) => `${e.email || ""}|${e.companyName}`));
    const itemsToCreate = [];
    for (const lead of leads) {
        const key = `${lead.email || ""}|${lead.companyName}`;
        if (existingKey.has(key))
            continue;
        const company = await db_1.prisma.company.findFirst({
            where: { name: lead.companyName },
            select: { id: true },
        });
        const contact = lead.email
            ? await db_1.prisma.contact.findFirst({
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
            role: lead.role ?? null,
            companyName: lead.companyName,
            websiteUrl: lead.websiteUrl,
            country: lead.country,
            city: lead.city,
            industry: lead.industry ?? null,
            sizeBucket: lead.sizeBucket ?? null,
            score: lead.score ?? null,
        });
    }
    if (itemsToCreate.length) {
        await db_1.prisma.leadListItem.createMany({ data: itemsToCreate });
    }
    await db_1.prisma.leadList.update({
        where: { id: leadList.id },
        data: { updatedAt: new Date() },
    });
    return { added: itemsToCreate.length, totalCandidates: leads.length };
}
async function fallbackCompanyId(companyName) {
    const company = await db_1.prisma.company.create({
        data: {
            name: companyName,
            domain: null,
            source: "list_snapshot",
        },
    });
    return company.id;
}
async function updateLeadList(userId, id, updates) {
    const list = await db_1.prisma.leadList.findFirst({ where: { id, userId } });
    if (!list)
        throw new Error("Lead list not found");
    const data = {};
    if (typeof updates.name === "string")
        data.name = updates.name.trim();
    if (typeof updates.description !== "undefined")
        data.description = updates.description?.trim() || null;
    return db_1.prisma.leadList.update({ where: { id }, data });
}
async function deleteLeadList(userId, id) {
    const list = await db_1.prisma.leadList.findFirst({ where: { id, userId }, select: { id: true } });
    if (!list)
        throw new Error("Lead list not found");
    await db_1.prisma.leadListItem.deleteMany({ where: { leadListId: id } });
    await db_1.prisma.leadList.delete({ where: { id } });
    return { success: true };
}
async function removeLeadListItems(userId, leadListId, itemIds) {
    const list = await db_1.prisma.leadList.findFirst({ where: { id: leadListId, userId }, select: { id: true } });
    if (!list)
        throw new Error("Lead list not found");
    const result = await db_1.prisma.leadListItem.deleteMany({ where: { id: { in: itemIds }, leadListId } });
    return { removed: result.count };
}
//# sourceMappingURL=leadListService.js.map