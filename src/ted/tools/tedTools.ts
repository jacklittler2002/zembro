import { z } from "zod";

export type TedToolName =
  | "check_credits"
  | "estimate_credits"
  | "start_lead_search"
  | "get_lead_search_status"
  | "preview_leads"
  | "export_leads_csv"
  | "create_subscription_checkout"
  | "create_credit_pack_checkout"
  | "create_list"
  | "list_lists"
  | "add_from_search_to_list"
  | "export_list_csv";

export const ToolSchemas = {
  check_credits: z.object({}),
  estimate_credits: z.object({
    action: z.enum(["TED_MESSAGE", "DISCOVERY", "CRAWL", "ENRICH", "EXPORT"]),
    quantity: z.number().int().positive().default(1),
  }),
  start_lead_search: z.object({
    query: z.string().min(2),
    maxLeads: z.number().int().positive().max(5000).default(100),
  }),
  get_lead_search_status: z.object({
    leadSearchId: z.string().min(5),
  }),
  preview_leads: z.object({
    leadSearchId: z.string().min(5),
    limit: z.number().int().positive().max(200).default(25),
    filters: z
      .object({
        minScore: z.number().int().min(0).max(100).optional(),
        industry: z.string().optional(),
        sizeBucket: z.enum(["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"]).optional(),
        country: z.string().optional(),
        decisionMakerOnly: z.boolean().optional(),
      })
      .optional(),
  }),
  export_leads_csv: z.object({
    leadSearchId: z.string().min(5),
    // optional filters (same as preview)
    filters: z
      .object({
        minScore: z.number().int().min(0).max(100).optional(),
        industry: z.string().optional(),
        sizeBucket: z.enum(["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"]).optional(),
        country: z.string().optional(),
        decisionMakerOnly: z.boolean().optional(),
      })
      .optional(),
  }),
  create_subscription_checkout: z.object({
    planCode: z.enum(["STARTER", "GROWTH", "SCALE"]),
  }),
  create_credit_pack_checkout: z.object({
    packCode: z.enum(["5K", "20K"]),
  }),
  create_list: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
  }),
  list_lists: z.object({}),
  add_from_search_to_list: z.object({
    leadListId: z.string().min(5),
    leadSearchId: z.string().min(5),
    limit: z.number().int().positive().max(5000).optional(),
    filters: z
      .object({
        minScore: z.number().int().min(0).max(100).optional(),
        industry: z.string().optional(),
        sizeBucket: z.enum(["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"]).optional(),
        country: z.string().optional(),
        decisionMakerOnly: z.boolean().optional(),
      })
      .optional(),
  }),
  export_list_csv: z.object({
    leadListId: z.string().min(5),
  }),
} as const;

export function getToolSchema(name: TedToolName) {
  return ToolSchemas[name];
}
