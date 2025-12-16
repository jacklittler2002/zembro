/**
 * TED AI Agent Tool Definitions
 *
 * These tools allow TED to execute actions via GPT-4o function calling.
 * Each tool has a schema (for GPT) and an executor (for running the action).
 */
export declare const TED_TOOLS: ({
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                query: {
                    type: string;
                    description: string;
                };
                maxLeads: {
                    type: string;
                    description: string;
                    default: number;
                };
                leadSearchId?: never;
                minScore?: never;
                industry?: never;
                sizeBucket?: never;
                country?: never;
                decisionMakerOnly?: never;
                excludePreviousExports?: never;
                limit?: never;
            };
            required: string[];
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                leadSearchId: {
                    type: string;
                    description: string;
                };
                query?: never;
                maxLeads?: never;
                minScore?: never;
                industry?: never;
                sizeBucket?: never;
                country?: never;
                decisionMakerOnly?: never;
                excludePreviousExports?: never;
                limit?: never;
            };
            required: string[];
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                leadSearchId: {
                    type: string;
                    description: string;
                };
                minScore: {
                    type: string;
                    description: string;
                };
                industry: {
                    type: string;
                    description: string;
                };
                sizeBucket: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                country: {
                    type: string;
                    description: string;
                };
                decisionMakerOnly: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                excludePreviousExports: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                limit: {
                    type: string;
                    description: string;
                    default?: never;
                };
                query?: never;
                maxLeads?: never;
            };
            required: string[];
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                leadSearchId: {
                    type: string;
                    description: string;
                };
                excludePreviousExports: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                query?: never;
                maxLeads?: never;
                minScore?: never;
                industry?: never;
                sizeBucket?: never;
                country?: never;
                decisionMakerOnly?: never;
                limit?: never;
            };
            required: string[];
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                query?: never;
                maxLeads?: never;
                leadSearchId?: never;
                minScore?: never;
                industry?: never;
                sizeBucket?: never;
                country?: never;
                decisionMakerOnly?: never;
                excludePreviousExports?: never;
                limit?: never;
            };
            required: never[];
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                maxLeads: {
                    type: string;
                    description: string;
                    default: number;
                };
                query?: never;
                leadSearchId?: never;
                minScore?: never;
                industry?: never;
                sizeBucket?: never;
                country?: never;
                decisionMakerOnly?: never;
                excludePreviousExports?: never;
                limit?: never;
            };
            required: never[];
        };
    };
} | {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                limit: {
                    type: string;
                    description: string;
                    default: number;
                };
                query?: never;
                maxLeads?: never;
                leadSearchId?: never;
                minScore?: never;
                industry?: never;
                sizeBucket?: never;
                country?: never;
                decisionMakerOnly?: never;
                excludePreviousExports?: never;
            };
            required: never[];
        };
    };
})[];
/**
 * TED's system prompt - defines personality and capabilities
 */
export declare const TED_SYSTEM_PROMPT = "You are TED, an AI assistant for Zembro - a B2B lead generation platform.\n\nYour role is to help users discover, enrich, and export business leads through natural conversation.\n\n**Core Capabilities:**\n- Start lead searches for any type of business (e.g., \"Find 100 dentists in London\")\n- Filter results by industry, company size, location, quality, decision makers\n- Export leads to CSV format\n- Track and prevent duplicate exports\n- Show credit balance and estimate costs\n- Provide guidance on lead generation best practices\n\n**Personality:**\n- Professional but friendly\n- Proactive - suggest next steps\n- Clear about costs and credits\n- Encourage best practices (filtering for decision makers, excluding duplicates)\n- Concise - get to the point quickly\n\n**Important Rules:**\n1. ALWAYS estimate credits before expensive operations\n2. SUGGEST excluding previous exports by default\n3. RECOMMEND filtering to decision makers for higher quality\n4. EXPLAIN what's happening during async operations (discovery, crawling, enrichment)\n5. When a search is RUNNING, tell users it may take 2-5 minutes\n6. If user runs low on credits, suggest upgrading plan\n\n**Multi-step workflows:**\nWhen users ask for complex tasks, break them down:\n- \"Find 100 physios in South Dakota for private practitioners, I need business owners\"\n  \u2192 create_lead_search with query\n  \u2192 Wait for completion\n  \u2192 get_leads with decisionMakerOnly=true\n  \u2192 Summarize results\n  \u2192 Ask if they want to export\n\n**Natural language understanding:**\n- \"give me leads\" = get_leads\n- \"export that\" / \"download csv\" = export_leads_to_csv  \n- \"how many credits\" / \"balance\" = get_credit_balance\n- \"show my searches\" = list_user_lead_searches\n- \"filter to owners\" = get_leads with decisionMakerOnly=true\n- \"exclude duplicates\" = use excludePreviousExports=true (default)\n\nBe helpful, efficient, and always optimize for quality over quantity.";
//# sourceMappingURL=tools.d.ts.map