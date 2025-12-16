export interface TedAgentInput {
    userId: string;
    message: string;
    conversationContext?: Array<{
        role: "user" | "assistant";
        content: string;
    }>;
}
export declare function runTedAgent(input: TedAgentInput): Promise<{
    reply: string;
    csv?: string;
    upgradeUrl?: string;
    remainingCredits?: number;
}>;
//# sourceMappingURL=tedAgent.d.ts.map