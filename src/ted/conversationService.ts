import { prisma } from "../db";
import { logger } from "../logger";
import { TedMessageRole } from "@prisma/client";

/**
 * Create a new conversation for a user.
 * Optionally provide an initial title (can be updated later).
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<string> {
  const conversation = await prisma.tedConversation.create({
    data: {
      userId,
      title: title || "New Conversation",
    },
  });

  logger.info(`Created conversation ${conversation.id} for user ${userId}`);
  return conversation.id;
}

/**
 * Append a message to an existing conversation.
 */
export async function appendMessage(
  conversationId: string,
  role: TedMessageRole,
  content: string
): Promise<void> {
  await prisma.tedMessage.create({
    data: {
      conversationId,
      role,
      content,
    },
  });

  logger.info(
    `Appended ${role} message to conversation ${conversationId}`
  );
}

/**
 * Get a conversation with all its messages.
 */
export async function getConversation(conversationId: string) {
  const conversation = await prisma.tedConversation.findUnique({
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
export async function listUserConversations(userId: string) {
  const conversations = await prisma.tedConversation.findMany({
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
