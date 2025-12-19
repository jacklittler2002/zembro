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
    // Multi-source enrichment: Clearbit, LinkedIn, BuiltWith, AI fallback
    // 1. Clearbit (or similar)
    const clearbitData = {};
    if (process.env.CLEARBIT_API_KEY) {
        try {
            // TODO: Implement Clearbit API call here
            // Example: const resp = await fetch(...)
            // clearbitData = mapClearbitToEnrichment(resp)
        }
        catch (err) {
            logger_1.logger.warn(`Clearbit enrichment failed for ${company.domain}: ${err}`);
        }
    }
    // 2. LinkedIn (scraping or API)
    const linkedinData = {};
    if (process.env.LINKEDIN_API_KEY) {
        try {
            // TODO: Implement LinkedIn API call or scraping here
            // linkedinData = mapLinkedInToEnrichment(resp)
        }
        catch (err) {
            logger_1.logger.warn(`LinkedIn enrichment failed for ${company.domain}: ${err}`);
        }
    }
    // 3. BuiltWith/Wappalyzer (tech stack)
    const techData = {};
    if (process.env.BUILTWITH_API_KEY) {
        try {
            // TODO: Implement BuiltWith API call here
            // techData = mapBuiltWithToEnrichment(resp)
        }
        catch (err) {
            logger_1.logger.warn(`BuiltWith enrichment failed for ${company.domain}: ${err}`);
        }
    }
    // 4. AI fallback/augmentation
    let aiData = {};
    if (process.env.OPENAI_API_KEY) {
        const content = company.rawContent || "";
        if (content.length >= 50) {
            try {
                const prompt = `You are a business intelligence AI. Analyze the following website content and provide comprehensive business classification data.\n\nDomain: ${company.domain}\nWebsite URL: ${company.websiteUrl || "N/A"}\n\nContent excerpt:\n${content.substring(0, 4000)}\n\nRespond ONLY with valid JSON in this EXACT format (no additional text): ...`;
                const response = await openaiClient_1.openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are an API that returns only JSON, no additional text. You analyze businesses and provide structured data." },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 500,
                });
                const rawContent = response.choices[0]?.message?.content?.trim();
                if (rawContent) {
                    try {
                        aiData = JSON.parse(rawContent);
                    }
                    catch {
                        logger_1.logger.error(`Failed to parse AI response as JSON: ${rawContent}`);
                    }
                }
            }
            catch (error) {
                logger_1.logger.error(`AI enrichment failed for ${company.domain}: ${error.message}`);
            }
        }
    }
    // 5. Merge all sources (priority: Clearbit > LinkedIn > BuiltWith > AI)
    const merged = {
        category: clearbitData.category || linkedinData.category || aiData.category || null,
        niche: clearbitData.niche || linkedinData.niche || aiData.niche || null,
        tags: clearbitData.tags || linkedinData.tags || aiData.tags || [],
        confidence: clearbitData.confidence || linkedinData.confidence || aiData.confidence || null,
        industry: clearbitData.industry || linkedinData.industry || aiData.industry || null,
        sizeBucket: clearbitData.sizeBucket || linkedinData.sizeBucket || aiData.sizeBucket || null,
        hqCity: clearbitData.hqCity || linkedinData.hqCity || aiData.hqCity || null,
        hqCountry: clearbitData.hqCountry || linkedinData.hqCountry || aiData.hqCountry || null,
        businessType: clearbitData.businessType || linkedinData.businessType || aiData.businessType || null,
        keywords: clearbitData.keywords || linkedinData.keywords || aiData.keywords || [],
        idealCustomerNotes: clearbitData.idealCustomerNotes || linkedinData.idealCustomerNotes || aiData.idealCustomerNotes || null,
    };
    // 6. Tech stack merge (add to tags/keywords)
    if (techData.tags && techData.tags.length) {
        merged.tags = Array.from(new Set([...(merged.tags || []), ...techData.tags]));
    }
    if (techData.keywords && techData.keywords.length) {
        merged.keywords = Array.from(new Set([...(merged.keywords || []), ...techData.keywords]));
    }
    // 7. TODO: Add confidence scoring, source attribution, and caching
    return merged;
}
//# sourceMappingURL=enrichCompany.js.map