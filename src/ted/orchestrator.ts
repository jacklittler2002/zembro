// TED Orchestrator: Handles multi-step workflows, intent resolution, and user info gathering for TED
import { runTedAgent } from "./tedAgent";
import { executeTool } from "./toolExecutor";

export interface TedOrchestratorInput {
  userId: string;
  conversationId: string;
  userMessage: string;
  context?: Record<string, any>;
}

export interface TedOrchestratorResult {
  messages: Array<{ role: string; content: string }>;
}

/**
 * Main orchestrator for TED. Handles user message, runs agent, executes tools, and manages workflow state.
 */
export async function runTedOrchestrator(input: TedOrchestratorInput): Promise<TedOrchestratorResult> {
  // 1. Run TED agent to get intent/tool calls
  const agentResult = await runTedAgent({
    userId: input.userId,
    conversationId: input.conversationId,
    userMessage: input.userMessage,
    context: input.context,
  });

  const actions: Array<{ name: string; args: any; result: any }> = [];
  let messages = agentResult.messages || [];

  // 2. If agent wants to call tools, execute them
  if (agentResult.toolCalls && agentResult.toolCalls.length > 0) {
    for (const toolCall of agentResult.toolCalls) {
      const { name, args } = toolCall;
      try {
        const result = await executeTool(input.userId, { name, ...args });
        actions.push({ name, args, result });
        messages.push({ role: "ted", content: `Action '${name}' completed.` });
      } catch (err: any) {
        messages.push({ role: "ted", content: `Error running action '${name}': ${err.message}` });
      }
    }
  }

  // 3. If agent needs more info, set nextStep
  let nextStep = agentResult.nextStep || null;

  return { messages, actions, nextStep };
}
