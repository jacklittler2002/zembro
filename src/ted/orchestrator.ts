// TED Orchestrator: Handles user message and returns TED agent's reply and any extra fields
import { runTedAgent } from "./tedAgent";

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
export async function runTedOrchestrator(input: TedOrchestratorInput): Promise<TedOrchestratorResult> {
  // Load conversation context if conversationId is provided
  let conversationContext: Array<{ role: "user" | "assistant"; content: string }> = [];
  if (input.conversationId) {
    const prisma = (await import("../db")).prisma;
    const messages = await prisma.tedMessage.findMany({
      where: { conversationId: input.conversationId },
      orderBy: { createdAt: "asc" },
      take: 12,
    });
    conversationContext = messages.map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }
  const agentResult = await runTedAgent({
    userId: input.userId,
    message: input.userMessage,
    conversationContext,
  });
  return agentResult;
}
