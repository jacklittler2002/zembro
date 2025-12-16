import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  // Don't throw at import time; just log a warning
  // Real failure should happen when trying to call the API
  console.warn("OPENAI_API_KEY is not set; AI enrichment will not work.");
}

export const openai = new OpenAI({
  apiKey,
});
