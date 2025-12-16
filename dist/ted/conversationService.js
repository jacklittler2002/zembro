"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversation = createConversation;
exports.appendMessage = appendMessage;
exports.getConversation = getConversation;
exports.listUserConversations = listUserConversations;
const db_js_1 = require("../db.js");
const logger_js_1 = require("../logger.js");
/**
 * Create a new conversation for a user.
 * Optionally provide an initial title (can be updated later).
 */
async function createConversation(userId, title) {
    const conversation = await db_js_1.prisma.tedConversation.create({
        data: {
            userId,
            title: title || "New Conversation",
        },
    });
    logger_js_1.logger.info(`Created conversation ${conversation.id} for user ${userId}`);
    return conversation.id;
}
/**
 * Append a message to an existing conversation.
 */
async function appendMessage(conversationId, role, content) {
    await db_js_1.prisma.tedMessage.create({
        data: {
            conversationId,
            role,
            content,
        },
    });
    logger_js_1.logger.info(`Appended ${role} message to conversation ${conversationId}`);
}
/**
 * Get a conversation with all its messages.
 */
async function getConversation(conversationId) {
    const conversation = await db_js_1.prisma.tedConversation.findUnique({
        where: { id: conversationId },
        include: {
            messages: {
                orderBy: { createdAt: "asc" },
            },
        },
    });
    if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
    }
    return conversation;
}
/**
 * List all conversations for a user.
 * Returns most recent conversations first.
 */
async function listUserConversations(userId) {
    const conversations = await db_js_1.prisma.tedConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1, // Include the last message for preview
            },
        },
    });
    return conversations;
}
//# sourceMappingURL=conversationService.js.map