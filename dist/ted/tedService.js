"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTedChat = handleTedChat;
const logger_1 = require("../logger");
const creditService_1 = require("./creditService");
const conversationService_1 = require("./conversationService");
const openaiClient_1 = require("../ai/openaiClient");
const tools_1 = require("./tools");
const toolExecutor_1 = require("./toolExecutor");
const CREDITS_PER_MESSAGE = 1;
/**
 * Handle a chat interaction with TED.
 * - Validates credit balance
 * - Creates or uses existing conversation
 * - Appends user message
 * - Generates AI response (stubbed for now)
 * - Appends assistant message
 * - Deducts credits
 */
async function handleTedChat(userId, userMessage, conversationId) {
    // Step 1: Check credit balance
    const balance = await (0, creditService_1.getCreditBalance)(userId);
    if (balance < CREDITS_PER_MESSAGE) {
        throw new creditService_1.CreditError("INSUFFICIENT_CREDITS", `Insufficient credits. You need ${CREDITS_PER_MESSAGE} credit(s), but have ${balance}.`, {
            required: CREDITS_PER_MESSAGE,
            available: balance,
        });
    }
    // Step 2: Get or create conversation
    let convId = conversationId;
    if (!convId) {
        convId = await (0, conversationService_1.createConversation)(userId, "Chat with TED");
    }
    else {
        // Verify conversation exists and belongs to user
        const conv = await (0, conversationService_1.getConversation)(convId);
        if (conv.userId !== userId) {
            throw new Error("Conversation does not belong to this user");
        }
    }
    // Step 3: Append user message
    await (0, conversationService_1.appendMessage)(convId, "user", userMessage);
    // Step 4: Generate AI response (STUB)
    const assistantMessage = await generateAiResponse(convId, userMessage);
    // Step 5: Append assistant message
    await (0, conversationService_1.appendMessage)(convId, "assistant", assistantMessage);
    // Step 6: Deduct credits
    await (0, creditService_1.consumeCredits)(userId, CREDITS_PER_MESSAGE, "TED chat message", {
        conversationId: convId,
        userMessage: userMessage.substring(0, 50),
    });
    const newBalance = await (0, creditService_1.getCreditBalance)(userId);
    logger_1.logger.info(`TED chat completed for user ${userId} in conversation ${convId}. Credits used: ${CREDITS_PER_MESSAGE}, remaining: ${newBalance}`);
    return {
        conversationId: convId,
        assistantMessage,
        creditsUsed: CREDITS_PER_MESSAGE,
        remainingBalance: newBalance,
    };
}
/**
 * Generate an AI response using GPT-4o with function calling.
 * Handles multi-step tool execution and returns natural language response.
 */
async function generateAiResponse(conversationId, userMessage) {
    logger_1.logger.info(`Generating AI response for conversation ${conversationId}`);
    // Get conversation history for context
    const conversation = await (0, conversationService_1.getConversation)(conversationId);
    const messages = conversation.messages || [];
    // Build message history for GPT (last 10 messages for context)
    const recentMessages = messages.slice(-10);
    const chatHistory = [
        {
            role: "system",
            content: tools_1.TED_SYSTEM_PROMPT,
        },
        ...recentMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        })),
        {
            role: "user",
            content: userMessage,
        },
    ];
    // Call GPT-4o with function calling
    let response = await openaiClient_1.openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatHistory,
        tools: tools_1.TED_TOOLS,
        tool_choice: "auto",
    });
    let assistantMessage = "";
    let iterationCount = 0;
    const maxIterations = 5; // Prevent infinite loops
    // Loop to handle multiple tool calls
    while (response.choices[0]?.finish_reason === "tool_calls" && iterationCount < maxIterations) {
        iterationCount++;
        const toolCalls = response.choices[0]?.message.tool_calls || [];
        logger_1.logger.info(`TED making ${toolCalls.length} tool call(s) in iteration ${iterationCount}`);
        // Add assistant message with tool calls to history
        chatHistory.push(response.choices[0].message);
        // Execute each tool call
        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            logger_1.logger.info(`Executing tool: ${functionName}`, functionArgs);
            // Execute the tool
            const result = await (0, toolExecutor_1.executeTool)(conversation.userId, functionName, functionArgs);
            // Add tool result to chat history
            chatHistory.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: result,
            });
        }
        // Get next response from GPT
        response = await openaiClient_1.openai.chat.completions.create({
            model: "gpt-4o",
            messages: chatHistory,
            tools: tools_1.TED_TOOLS,
            tool_choice: "auto",
        });
    }
    // Extract final message
    assistantMessage = response.choices?.[0]?.message?.content || "I encountered an issue processing your request.";
    logger_1.logger.info(`TED response generated after ${iterationCount} tool call iteration(s)`);
    return assistantMessage;
}
//# sourceMappingURL=tedService.js.map