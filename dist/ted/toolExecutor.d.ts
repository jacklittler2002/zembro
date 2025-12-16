/**
 * Execute a tool call from GPT-4o
 *
 * Takes the function name and arguments from GPT, runs the actual backend logic,
 * and returns results in a format GPT can understand.
 */
export declare function executeTool(userId: string, toolName: string, args: any): Promise<string>;
//# sourceMappingURL=toolExecutor.d.ts.map