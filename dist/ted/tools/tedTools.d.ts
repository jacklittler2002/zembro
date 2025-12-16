import { z } from "zod";
export type TedToolName = "check_credits" | "estimate_credits" | "start_lead_search" | "get_lead_search_status" | "preview_leads" | "export_leads_csv" | "create_subscription_checkout" | "create_credit_pack_checkout" | "create_list" | "list_lists" | "add_from_search_to_list" | "export_list_csv";
export declare const ToolSchemas: {
    readonly check_credits: z.ZodObject<{}, z.core.$strip>;
    readonly estimate_credits: z.ZodObject<{
        action: z.ZodEnum<{
            DISCOVERY: "DISCOVERY";
            TED_MESSAGE: "TED_MESSAGE";
            CRAWL: "CRAWL";
            ENRICH: "ENRICH";
            EXPORT: "EXPORT";
        }>;
        quantity: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
    readonly start_lead_search: z.ZodObject<{
        query: z.ZodString;
        maxLeads: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
    readonly get_lead_search_status: z.ZodObject<{
        leadSearchId: z.ZodString;
    }, z.core.$strip>;
    readonly preview_leads: z.ZodObject<{
        leadSearchId: z.ZodString;
        limit: z.ZodDefault<z.ZodNumber>;
        filters: z.ZodOptional<z.ZodObject<{
            minScore: z.ZodOptional<z.ZodNumber>;
            industry: z.ZodOptional<z.ZodString>;
            sizeBucket: z.ZodOptional<z.ZodEnum<{
                MICRO: "MICRO";
                SMALL: "SMALL";
                SMB: "SMB";
                MIDMARKET: "MIDMARKET";
                ENTERPRISE: "ENTERPRISE";
            }>>;
            country: z.ZodOptional<z.ZodString>;
            decisionMakerOnly: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    readonly export_leads_csv: z.ZodObject<{
        leadSearchId: z.ZodString;
        filters: z.ZodOptional<z.ZodObject<{
            minScore: z.ZodOptional<z.ZodNumber>;
            industry: z.ZodOptional<z.ZodString>;
            sizeBucket: z.ZodOptional<z.ZodEnum<{
                MICRO: "MICRO";
                SMALL: "SMALL";
                SMB: "SMB";
                MIDMARKET: "MIDMARKET";
                ENTERPRISE: "ENTERPRISE";
            }>>;
            country: z.ZodOptional<z.ZodString>;
            decisionMakerOnly: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    readonly create_subscription_checkout: z.ZodObject<{
        planCode: z.ZodEnum<{
            STARTER: "STARTER";
            GROWTH: "GROWTH";
            SCALE: "SCALE";
        }>;
    }, z.core.$strip>;
    readonly create_credit_pack_checkout: z.ZodObject<{
        packCode: z.ZodEnum<{
            "5K": "5K";
            "20K": "20K";
        }>;
    }, z.core.$strip>;
    readonly create_list: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    readonly list_lists: z.ZodObject<{}, z.core.$strip>;
    readonly add_from_search_to_list: z.ZodObject<{
        leadListId: z.ZodString;
        leadSearchId: z.ZodString;
        limit: z.ZodOptional<z.ZodNumber>;
        filters: z.ZodOptional<z.ZodObject<{
            minScore: z.ZodOptional<z.ZodNumber>;
            industry: z.ZodOptional<z.ZodString>;
            sizeBucket: z.ZodOptional<z.ZodEnum<{
                MICRO: "MICRO";
                SMALL: "SMALL";
                SMB: "SMB";
                MIDMARKET: "MIDMARKET";
                ENTERPRISE: "ENTERPRISE";
            }>>;
            country: z.ZodOptional<z.ZodString>;
            decisionMakerOnly: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    readonly export_list_csv: z.ZodObject<{
        leadListId: z.ZodString;
    }, z.core.$strip>;
};
export declare function getToolSchema(name: TedToolName): z.ZodObject<{}, z.core.$strip> | z.ZodObject<{
    action: z.ZodEnum<{
        DISCOVERY: "DISCOVERY";
        TED_MESSAGE: "TED_MESSAGE";
        CRAWL: "CRAWL";
        ENRICH: "ENRICH";
        EXPORT: "EXPORT";
    }>;
    quantity: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip> | z.ZodObject<{
    query: z.ZodString;
    maxLeads: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip> | z.ZodObject<{
    leadSearchId: z.ZodString;
}, z.core.$strip> | z.ZodObject<{
    leadSearchId: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    filters: z.ZodOptional<z.ZodObject<{
        minScore: z.ZodOptional<z.ZodNumber>;
        industry: z.ZodOptional<z.ZodString>;
        sizeBucket: z.ZodOptional<z.ZodEnum<{
            MICRO: "MICRO";
            SMALL: "SMALL";
            SMB: "SMB";
            MIDMARKET: "MIDMARKET";
            ENTERPRISE: "ENTERPRISE";
        }>>;
        country: z.ZodOptional<z.ZodString>;
        decisionMakerOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip> | z.ZodObject<{
    leadSearchId: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        minScore: z.ZodOptional<z.ZodNumber>;
        industry: z.ZodOptional<z.ZodString>;
        sizeBucket: z.ZodOptional<z.ZodEnum<{
            MICRO: "MICRO";
            SMALL: "SMALL";
            SMB: "SMB";
            MIDMARKET: "MIDMARKET";
            ENTERPRISE: "ENTERPRISE";
        }>>;
        country: z.ZodOptional<z.ZodString>;
        decisionMakerOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip> | z.ZodObject<{
    planCode: z.ZodEnum<{
        STARTER: "STARTER";
        GROWTH: "GROWTH";
        SCALE: "SCALE";
    }>;
}, z.core.$strip> | z.ZodObject<{
    packCode: z.ZodEnum<{
        "5K": "5K";
        "20K": "20K";
    }>;
}, z.core.$strip> | z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip> | z.ZodObject<{}, z.core.$strip> | z.ZodObject<{
    leadListId: z.ZodString;
    leadSearchId: z.ZodString;
    limit: z.ZodOptional<z.ZodNumber>;
    filters: z.ZodOptional<z.ZodObject<{
        minScore: z.ZodOptional<z.ZodNumber>;
        industry: z.ZodOptional<z.ZodString>;
        sizeBucket: z.ZodOptional<z.ZodEnum<{
            MICRO: "MICRO";
            SMALL: "SMALL";
            SMB: "SMB";
            MIDMARKET: "MIDMARKET";
            ENTERPRISE: "ENTERPRISE";
        }>>;
        country: z.ZodOptional<z.ZodString>;
        decisionMakerOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip> | z.ZodObject<{
    leadListId: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=tedTools.d.ts.map