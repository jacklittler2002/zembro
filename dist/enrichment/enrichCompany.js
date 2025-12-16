"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichCompany = enrichCompany;
const openaiClient_1 = require("../ai/openaiClient");
const logger_1 = require("../logger");
/**
 * Enrich a company using AI to classify its business type, niche, and tags
 * based on website content and domain.
 */
async function enrichCompany(company) {
    // If no OpenAI API key, return fallback
    if (!process.env.OPENAI_API_KEY) {
        logger_1.logger.warn(`OPENAI_API_KEY not set; skipping AI enrichment for ${company.domain}`);
        return {
            category: null,
            niche: null,
            tags: [],
            confidence: null,
            industry: null,
            sizeBucket: null,
            hqCity: null,
            hqCountry: null,
            businessType: null,
            keywords: [],
            idealCustomerNotes: null,
        };
    }
    // If no content to analyze, return fallback
    const content = company.rawContent || "";
    if (content.length < 50) {
        logger_1.logger.warn(`Insufficient content for AI enrichment of ${company.domain}`);
        return {
            category: null,
            niche: null,
            tags: [],
            confidence: null,
            industry: null,
            sizeBucket: null,
            hqCity: null,
            hqCountry: null,
            businessType: null,
            keywords: [],
            idealCustomerNotes: null,
        };
    }
    try {
        // TODO: Tune this prompt for better reliability
        // TODO: Consider using a cheaper/smaller model in production at scale
        const prompt = `You are a business intelligence AI. Analyze the following website content and provide comprehensive business classification data.

Domain: ${company.domain}
Website URL: ${company.websiteUrl || "N/A"}

Content excerpt:
${content.substring(0, 4000)}

Respond ONLY with valid JSON in this EXACT format (no additional text):
{
  "category": "Primary business category (e.g., Dentist, Gym, Restaurant)",
  "niche": "Specific niche or specialty (e.g., Cosmetic dentistry clinic in London)",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.9,
  "industry": "Industry sector (e.g., Healthcare, Software, Professional Services)",
  "sizeBucket": "MICRO|SMALL|SMB|MIDMARKET|ENTERPRISE (infer from content/scale indicators)",
  "hqCity": "Headquarters city if mentioned",
  "hqCountry": "Headquarters country if mentioned",
  "businessType": "local_service|saas|agency|ecommerce|consulting|other",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "idealCustomerNotes": "Brief description of their ideal customer profile"
}

Guidelines:
- sizeBucket: MICRO (1-10), SMALL (11-50), SMB (51-200), MIDMARKET (201-1000), ENTERPRISE (1000+)
- businessType: Choose the most appropriate category
- confidence: 0.0 to 1.0 based on data quality
- Be specific and concise
- If information is unclear, use null for strings or empty array for arrays`;
        const response = await openaiClient_1.openai.chat.completions.create({
            model: "gpt-4o-mini", // Fast and cheap for classification
            messages: [
                {
                    role: "system",
                    content: "You are an API that returns only JSON, no additional text. You analyze businesses and provide structured data.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.3, // Lower for more consistent results
            max_tokens: 500,
        });
        const rawContent = response.choices[0]?.message?.content?.trim();
        if (!rawContent) {
            throw new Error("Empty response from OpenAI");
        }
        // Parse JSON response with robust error handling
        let parsed;
        try {
            parsed = JSON.parse(rawContent);
        }
        catch (parseError) {
            logger_1.logger.error(`Failed to parse AI response as JSON: ${rawContent}`);
            throw new Error("Invalid JSON response from AI");
        }
        // Map and validate fields with fallbacks
        const result = {
            category: parsed.category || null,
            niche: parsed.niche || null,
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
            confidence: typeof parsed.confidence === "number"
                ? Math.max(0, Math.min(1, parsed.confidence))
                : null,
            industry: parsed.industry || null,
            sizeBucket: parsed.sizeBucket || null, // Will be validated in handler
            hqCity: parsed.hqCity || null,
            hqCountry: parsed.hqCountry || null,
            businessType: parsed.businessType || null,
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
            idealCustomerNotes: parsed.idealCustomerNotes || null,
        };
        return result;
    }
    catch (error) {
        logger_1.logger.error(`AI enrichment failed for ${company.domain}: ${error.message}`);
        // Return fallback on error to avoid breaking the worker
        return {
            category: null,
            niche: null,
            tags: [],
            confidence: null,
            industry: null,
            sizeBucket: null,
            hqCity: null,
            hqCountry: null,
            businessType: null,
            keywords: [],
            idealCustomerNotes: null,
        };
    }
}
//# sourceMappingURL=enrichCompany.js.map