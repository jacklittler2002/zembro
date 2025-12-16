"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolSchemas = void 0;
exports.getToolSchema = getToolSchema;
const zod_1 = require("zod");
exports.ToolSchemas = {
    check_credits: zod_1.z.object({}),
    estimate_credits: zod_1.z.object({
        action: zod_1.z.enum(["TED_MESSAGE", "DISCOVERY", "CRAWL", "ENRICH", "EXPORT"]),
        quantity: zod_1.z.number().int().positive().default(1),
    }),
    start_lead_search: zod_1.z.object({
        query: zod_1.z.string().min(2),
        maxLeads: zod_1.z.number().int().positive().max(5000).default(100),
    }),
    get_lead_search_status: zod_1.z.object({
        leadSearchId: zod_1.z.string().min(5),
    }),
    preview_leads: zod_1.z.object({
        leadSearchId: zod_1.z.string().min(5),
        limit: zod_1.z.number().int().positive().max(200).default(25),
        filters: zod_1.z
            .object({
            minScore: zod_1.z.number().int().min(0).max(100).optional(),
            industry: zod_1.z.string().optional(),
            sizeBucket: zod_1.z.enum(["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"]).optional(),
            country: zod_1.z.string().optional(),
            decisionMakerOnly: zod_1.z.boolean().optional(),
        })
            .optional(),
    }),
    export_leads_csv: zod_1.z.object({
        leadSearchId: zod_1.z.string().min(5),
        // optional filters (same as preview)
        filters: zod_1.z
            .object({
            minScore: zod_1.z.number().int().min(0).max(100).optional(),
            industry: zod_1.z.string().optional(),
            sizeBucket: zod_1.z.enum(["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"]).optional(),
            country: zod_1.z.string().optional(),
            decisionMakerOnly: zod_1.z.boolean().optional(),
        })
            .optional(),
    }),
    create_subscription_checkout: zod_1.z.object({
        planCode: zod_1.z.enum(["STARTER", "GROWTH", "SCALE"]),
    }),
    create_credit_pack_checkout: zod_1.z.object({
        packCode: zod_1.z.enum(["5K", "20K"]),
    }),
    create_list: zod_1.z.object({
        name: zod_1.z.string().min(2),
        description: zod_1.z.string().optional(),
    }),
    list_lists: zod_1.z.object({}),
    add_from_search_to_list: zod_1.z.object({
        leadListId: zod_1.z.string().min(5),
        leadSearchId: zod_1.z.string().min(5),
        limit: zod_1.z.number().int().positive().max(5000).optional(),
        filters: zod_1.z
            .object({
            minScore: zod_1.z.number().int().min(0).max(100).optional(),
            industry: zod_1.z.string().optional(),
            sizeBucket: zod_1.z.enum(["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"]).optional(),
            country: zod_1.z.string().optional(),
            decisionMakerOnly: zod_1.z.boolean().optional(),
        })
            .optional(),
    }),
    export_list_csv: zod_1.z.object({
        leadListId: zod_1.z.string().min(5),
    }),
};
function getToolSchema(name) {
    return exports.ToolSchemas[name];
}
//# sourceMappingURL=tedTools.js.map