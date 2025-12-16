"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
async function testOpenAI() {
    console.log("Testing OpenAI connection...");
    console.log("API Key present:", !!process.env.OPENAI_API_KEY);
    console.log("Model:", process.env.OPENAI_TED_MODEL || "gpt-4o-mini");
    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_TED_MODEL || "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: "Say 'OpenAI is working!' in exactly those words",
                },
            ],
        });
        console.log("✅ OpenAI WORKS!");
        console.log("Response:", response.choices[0]?.message?.content || "No response");
    }
    catch (err) {
        console.log("❌ OpenAI FAILED!");
        console.log("Error:", err.message);
        process.exit(1);
    }
}
testOpenAI();
//# sourceMappingURL=testOpenAI.js.map