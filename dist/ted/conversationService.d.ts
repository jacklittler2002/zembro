import { TedMessageRole } from "@prisma/client";
/**
 * Create a new conversation for a user.
 * Optionally provide an initial title (can be updated later).
 */
export declare function createConversation(userId: string, title?: string): Promise<string>;
/**
 * Append a message to an existing conversation.
 */
export declare function appendMessage(conversationId: string, role: TedMessageRole, content: string): Promise<void>;
/**
 * Get a conversation with all its messages.
 */
export declare function getConversation(conversationId: string): Promise<{
    messages: {
        id: string;
        createdAt: Date;
        role: import(".prisma/client").$Enums.TedMessageRole;
        conversationId: string;
        content: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    title: string | null;
}>;
/**
 * List all conversations for a user.
 * Returns most recent conversations first.
 */
export declare function listUserConversations(userId: string): Promise<({
    messages: {
        id: string;
        createdAt: Date;
        role: import(".prisma/client").$Enums.TedMessageRole;
        conversationId: string;
        content: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    title: string | null;
})[]>;
//# sourceMappingURL=conversationService.d.ts.map