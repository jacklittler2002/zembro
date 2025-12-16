"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openai = void 0;
const openai_1 = __importDefault(require("openai"));
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    // Don't throw at import time; just log a warning
    // Real failure should happen when trying to call the API
    console.warn("OPENAI_API_KEY is not set; AI enrichment will not work.");
}
exports.openai = new openai_1.default({
    apiKey,
});
//# sourceMappingURL=openaiClient.js.map