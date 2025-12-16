/**
 * Handle a chat interaction with TED.
 * - Validates credit balance
 * - Creates or uses existing conversation
 * - Appends user message
 * - Generates AI response (stubbed for now)
 * - Appends assistant message
 * - Deducts credits
 */
export declare function handleTedChat(userId: string, userMessage: string, conversationId?: string): Promise<{
    conversationId: string;
    assistantMessage: string;
    creditsUsed: number;
    remainingBalance: number;
}>;
//# sourceMappingURL=tedService.d.ts.map