"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTedAgent = runTedAgent;
const openai_1 = __importDefault(require("openai"));
const executeTool_1 = require("./tools/executeTool");
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_TED_MODEL || "gpt-4o-mini";
function buildToolsForOpenAI() {
    // Define tools as "function" tools
    // (Follow OpenAI function calling guide flow)
    return [
        {
            type: "function",
            function: {
                name: "check_credits",
                description: "Get the user's current Zembro credit balance.",
                parameters: { type: "object", properties: {}, additionalProperties: false },
            },
        },
        {
            type: "function",
            function: {
                name: "estimate_credits",
                description: "Estimate credits for a given action and quantity.",
                parameters: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ["TED_MESSAGE", "DISCOVERY", "CRAWL", "ENRICH", "EXPORT"] },
                        quantity: { type: "integer", minimum: 1, default: 1 },
                    },
                    required: ["action"],
                    additionalProperties: false,
                },
            },
        },
        {
            type: "function",
            function: {
                name: "start_lead_search",
                description: "Start a lead search (discovery -> crawl -> enrich).",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string" },
                        maxLeads: { type: "integer", minimum: 1, maximum: 5000, default: 100 },
                    },
                    required: ["query"],
                    additionalProperties: false,
                },
            },
        },
        {
            type: "function",
            function: {
                name: "get_lead_search_status",
                description: "Get status of a lead search by ID.",
                parameters: {
                    type: "object",
                    properties: { leadSearchId: { type: "string" } },
                    required: ["leadSearchId"],
                    additionalProperties: false,
                },
            },
        },
        {
            type: "function",
            function: {
                name: "preview_leads",
                description: "Preview leads for a lead search with optional filters.",
                parameters: {
                    type: "object",
                    properties: {
                        leadSearchId: { type: "string" },
                        limit: { type: "integer", minimum: 1, maximum: 200, default: 25 },
                        filters: {
                            type: "object",
                            properties: {
                                minScore: { type: "integer", minimum: 0, maximum: 100 },
                                industry: { type: "string" },
                                sizeBucket: { type: "string", enum: ["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"] },
                                country: { type: "string" },
                                decisionMakerOnly: { type: "boolean" },
                            },
                            additionalProperties: false,
                        },
                    },
                    required: ["leadSearchId"],
                    additionalProperties: false,
                },
            },
        },
        {
            type: "function",
            function: {
                name: "export_leads_csv",
                description: "Export leads for a lead search as CSV (may cost credits).",
                parameters: {
                    type: "object",
                    properties: {
                        leadSearchId: { type: "string" },
                        filters: {
                            type: "object",
                            properties: {
                                minScore: { type: "integer", minimum: 0, maximum: 100 },
                                industry: { type: "string" },
                                sizeBucket: { type: "string", enum: ["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"] },
                                country: { type: "string" },
                                decisionMakerOnly: { type: "boolean" },
                            },
                            additionalProperties: false,
                        },
                    },
                    required: ["leadSearchId"],
                    additionalProperties: false,
                },
            },
        },
        {
            type: "function",
            function: {
                name: "create_subscription_checkout",
                description: "Create a Stripe checkout URL to upgrade subscription plan.",
                parameters: {
                    type: "object",
                    properties: { planCode: { type: "string", enum: ["STARTER", "GROWTH", "SCALE"] } },
                    required: ["planCode"],
                    additionalProperties: false,
                },
            },
        },
        {
            type: "function",
            function: {
                name: "create_credit_pack_checkout",
                description: "Create a Stripe checkout URL to buy credit pack.",
                parameters: {
                    type: "object",
                    properties: { packCode: { type: "string", enum: ["5K", "20K"] } },
                    required: ["packCode"],
                    additionalProperties: false,
                },
            },
        },
    ];
}
async function runTedAgent(input) {
    const tools = buildToolsForOpenAI();
    const system = `
You are TED, Zembro's friendly AI assistant. You can help users do anything inside Zembro — just like having a real sales ops expert at your fingertips.

**What you can do:**
- Find leads: "Find me 50 dentists in London" or "Get tech startups in San Francisco"
- Check progress: "How's my search going?" or "Show me what you found"
- Filter & preview: "Show me the best leads" or "Filter by score above 80"
- Export data: "Export these to CSV" or "Download the results"
- Manage credits: "How many credits do I have?" or "How much will this cost?"
- Upgrade account: Help users buy more credits or upgrade their plan

**Your personality:**
- Friendly and conversational (like talking to a helpful colleague)
- Proactive: suggest next steps, anticipate needs
- Clear: explain what you're doing and why
- Helpful: if they're low on credits, offer solutions immediately
- Natural: talk like a human, not a robot

**How to work:**
1. If a user asks to do something, just do it (don't ask for permission)
2. If you need credits, check the balance first
3. If insufficient credits, explain clearly and offer upgrade options with a direct link
4. When searches complete, proactively offer to show results or export
5. Use tools confidently — you have full access to Zembro's features

**Examples of great responses:**
- "I'll find you 50 dentists in London right now. Starting the search..."
- "Your search is 80% done — found 47 leads so far. Want to preview the best ones?"
- "You have 2,500 credits left. This export will use 100. Ready to go?"
- "You're out of credits, but I can help! The 5K pack is $49. [Get credits]"

Talk naturally. Be helpful. Get things done.
`;
    // We run a tool-calling loop (model -> tool -> model) per OpenAI guidance.
    const messages = [
        { role: "system", content: system },
    ];
    if (input.conversationContext?.length) {
        // Optional: carry short context from your DB
        for (const m of input.conversationContext.slice(-12)) {
            messages.push({ role: m.role, content: m.content });
        }
    }
    messages.push({ role: "user", content: input.message });
    // First request
    let response = await openai.chat.completions.create({
        model: MODEL,
        messages,
        tools,
    });
    // Tool loop
    let finalText = "";
    let csv;
    let upgradeUrl;
    let remainingCredits;
    for (let i = 0; i < 8; i++) {
        const message = response.choices[0]?.message;
        if (!message)
            break;
        // Add assistant message to history
        messages.push(message);
        // Collect assistant text if present
        if (message.content) {
            finalText += message.content;
        }
        const toolCalls = message.tool_calls;
        if (!toolCalls || toolCalls.length === 0)
            break;
        // Execute tool calls and send outputs back
        const toolMessages = [];
        for (const call of toolCalls) {
            const toolCall = call; // OpenAI SDK types vary between versions
            const name = toolCall.function.name;
            const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
            const result = await (0, executeTool_1.executeTedTool)({
                userId: input.userId,
                name,
                rawArgs: args,
            });
            // Capture special payloads
            if (name === "export_leads_csv" && result?.ok && result.csv) {
                csv = result.csv;
            }
            if ((name === "create_subscription_checkout" || name === "create_credit_pack_checkout") && result?.ok && result.url) {
                upgradeUrl = result.url;
            }
            if (name === "check_credits" && result?.ok && typeof result.balance === "number") {
                remainingCredits = result.balance;
            }
            toolMessages.push({
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify(result),
            });
        }
        // Add tool results to messages
        messages.push(...toolMessages);
        // Continue the conversation
        response = await openai.chat.completions.create({
            model: MODEL,
            messages,
            tools,
        });
    }
    // Fallback if no text came back
    if (!finalText.trim())
        finalText = "Done. What would you like to do next?";
    return {
        reply: finalText.trim(),
        ...(csv && { csv }),
        ...(upgradeUrl && { upgradeUrl }),
        ...(remainingCredits !== undefined && { remainingCredits })
    };
}
//# sourceMappingURL=tedAgent.js.map