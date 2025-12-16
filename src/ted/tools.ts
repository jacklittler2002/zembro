/**
 * TED AI Agent Tool Definitions
 * 
 * These tools allow TED to execute actions via GPT-4o function calling.
 * Each tool has a schema (for GPT) and an executor (for running the action).
 */

export const TED_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_lead_search",
      description: "Start a new lead search to discover businesses matching a query. This will automatically run discovery, crawl websites, and enrich data with AI. Returns a lead search ID that can be used to check status and get results.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language search query describing the target businesses. Examples: 'physiotherapists in South Dakota', 'SaaS companies in London', 'dental practices in Manchester'",
          },
          maxLeads: {
            type: "number",
            description: "Maximum number of leads to find. Default is 100. Higher numbers cost more credits.",
            default: 100,
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_lead_search_status",
      description: "Check the status of a lead search. Returns current status (PENDING, RUNNING, DONE, FAILED), number of companies found, and any errors.",
      parameters: {
        type: "object",
        properties: {
          leadSearchId: {
            type: "string",
            description: "The ID of the lead search to check",
          },
        },
        required: ["leadSearchId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_leads",
      description: "Retrieve leads from a completed lead search with optional filtering. Can filter by industry, company size, location, quality score, and decision makers.",
      parameters: {
        type: "object",
        properties: {
          leadSearchId: {
            type: "string",
            description: "The ID of the lead search",
          },
          minScore: {
            type: "number",
            description: "Minimum quality score (0-100). Higher scores indicate better data quality.",
          },
          industry: {
            type: "string",
            description: "Filter by industry (e.g., 'Healthcare', 'Software', 'Professional Services')",
          },
          sizeBucket: {
            type: "string",
            enum: ["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"],
            description: "Filter by company size: MICRO (1-10), SMALL (11-50), SMB (51-200), MIDMARKET (201-1000), ENTERPRISE (1000+)",
          },
          country: {
            type: "string",
            description: "Filter by country (e.g., 'United Kingdom', 'USA', 'Canada')",
          },
          decisionMakerOnly: {
            type: "boolean",
            description: "If true, only return contacts identified as likely decision makers (owners, partners, directors, etc.)",
            default: false,
          },
          excludePreviousExports: {
            type: "boolean",
            description: "If true, exclude leads that the user has already exported. Default is true to prevent duplicates.",
            default: true,
          },
          limit: {
            type: "number",
            description: "Maximum number of leads to return",
          },
        },
        required: ["leadSearchId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "export_leads_to_csv",
      description: "Export leads from a lead search to CSV format. This will track which leads were exported to prevent duplicates in future searches. Returns a download URL or CSV data.",
      parameters: {
        type: "object",
        properties: {
          leadSearchId: {
            type: "string",
            description: "The ID of the lead search to export",
          },
          excludePreviousExports: {
            type: "boolean",
            description: "If true, exclude previously exported leads. Default is true.",
            default: true,
          },
        },
        required: ["leadSearchId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_credit_balance",
      description: "Get the user's current AI credit balance. Credits are consumed for lead searches, enrichment, and TED conversations.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "estimate_credits",
      description: "Estimate how many credits a lead search will cost before running it. Helps users understand costs upfront.",
      parameters: {
        type: "object",
        properties: {
          maxLeads: {
            type: "number",
            description: "Number of leads to estimate for",
            default: 100,
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_user_lead_searches",
      description: "List all lead searches for the current user. Shows recent searches, their status, and results count.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of searches to return. Default is 10.",
            default: 10,
          },
        },
        required: [],
      },
    },
  },
];

/**
 * TED's system prompt - defines personality and capabilities
 */
export const TED_SYSTEM_PROMPT = `You are TED, an AI assistant for Zembro - a B2B lead generation platform.

Your role is to help users discover, enrich, and export business leads through natural conversation.

**Core Capabilities:**
- Start lead searches for any type of business (e.g., "Find 100 dentists in London")
- Filter results by industry, company size, location, quality, decision makers
- Export leads to CSV format
- Track and prevent duplicate exports
- Show credit balance and estimate costs
- Provide guidance on lead generation best practices

**Personality:**
- Professional but friendly
- Proactive - suggest next steps
- Clear about costs and credits
- Encourage best practices (filtering for decision makers, excluding duplicates)
- Concise - get to the point quickly

**Important Rules:**
1. ALWAYS estimate credits before expensive operations
2. SUGGEST excluding previous exports by default
3. RECOMMEND filtering to decision makers for higher quality
4. EXPLAIN what's happening during async operations (discovery, crawling, enrichment)
5. When a search is RUNNING, tell users it may take 2-5 minutes
6. If user runs low on credits, suggest upgrading plan

**Multi-step workflows:**
When users ask for complex tasks, break them down:
- "Find 100 physios in South Dakota for private practitioners, I need business owners"
  → create_lead_search with query
  → Wait for completion
  → get_leads with decisionMakerOnly=true
  → Summarize results
  → Ask if they want to export

**Natural language understanding:**
- "give me leads" = get_leads
- "export that" / "download csv" = export_leads_to_csv  
- "how many credits" / "balance" = get_credit_balance
- "show my searches" = list_user_lead_searches
- "filter to owners" = get_leads with decisionMakerOnly=true
- "exclude duplicates" = use excludePreviousExports=true (default)

Be helpful, efficient, and always optimize for quality over quantity.`;
