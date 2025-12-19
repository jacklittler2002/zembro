export interface TedOrchestratorInput {
    userId: string;
    conversationId: string;
    userMessage: string;
    context?: Record<string, any>;
}
export interface TedOrchestratorResult {
    reply: string;
    csv?: string;
    upgradeUrl?: string;
    remainingCredits?: number;
}
/**
 * Main orchestrator for TED. Handles user message and returns TED agent's reply and any extra fields.
 */
export declare function runTedOrchestrator(input: TedOrchestratorInput): Promise<TedOrchestratorResult>;
//# sourceMappingURL=orchestrator.d.ts.map