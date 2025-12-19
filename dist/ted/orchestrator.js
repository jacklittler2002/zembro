"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTedOrchestrator = runTedOrchestrator;
// TED Orchestrator: Handles user message and returns TED agent's reply and any extra fields
const tedAgent_1 = require("./tedAgent");
/**
 * Main orchestrator for TED. Handles user message and returns TED agent's reply and any extra fields.
 */
async function runTedOrchestrator(input) {
    // Load conversation context if conversationId is provided
    let conversationContext = [];
    if (input.conversationId) {
        const prisma = (await Promise.resolve().then(() => __importStar(require("../db")))).prisma;
        const messages = await prisma.tedMessage.findMany({
            where: { conversationId: input.conversationId },
            orderBy: { createdAt: "asc" },
            take: 12,
        });
        conversationContext = messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));
    }
    const agentResult = await (0, tedAgent_1.runTedAgent)({
        userId: input.userId,
        message: input.userMessage,
        conversationContext,
    });
    return agentResult;
}
//# sourceMappingURL=orchestrator.js.map