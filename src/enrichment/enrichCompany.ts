import { Company } from "@prisma/client";
import { openai } from "../ai/openaiClient";
import { logger } from "../logger";

export interface EnrichmentResult {
  category: string | null;
  niche: string | null;
  tags: string[];
  confidence: number | null;

  // V2 Enrichment fields
  industry: string | null;
  sizeBucket: string | null;  // will map to CompanySize enum
  hqCity: string | null;
  hqCountry: string | null;
  businessType: string | null;
  keywords: string[];
  idealCustomerNotes: string | null;
}

/**
 * Enrich a company using AI to classify its business type, niche, and tags
 * based on website content and domain.
 */
export async function enrichCompany(
  company: Company
): Promise<EnrichmentResult> {
  // Multi-source enrichment: Clearbit, LinkedIn, BuiltWith, AI fallback

  // 1. Clearbit (or similar)
  let clearbitData: Partial<EnrichmentResult> = {};
  if (process.env.CLEARBIT_API_KEY) {
    try {
      // TODO: Implement Clearbit API call here
      // Example: const resp = await fetch(...)
      // clearbitData = mapClearbitToEnrichment(resp)
    } catch (err) {
      logger.warn(`Clearbit enrichment failed for ${company.domain}: ${err}`);
    }
  }

  // 2. LinkedIn (scraping or API)
  let linkedinData: Partial<EnrichmentResult> = {};
  if (process.env.LINKEDIN_API_KEY) {
    try {
      // TODO: Implement LinkedIn API call or scraping here
      // linkedinData = mapLinkedInToEnrichment(resp)
    } catch (err) {
      logger.warn(`LinkedIn enrichment failed for ${company.domain}: ${err}`);
    }
  }

  // 3. BuiltWith/Wappalyzer (tech stack)
  let techData: Partial<EnrichmentResult> = {};
  if (process.env.BUILTWITH_API_KEY) {
    try {
      // TODO: Implement BuiltWith API call here
      // techData = mapBuiltWithToEnrichment(resp)
    } catch (err) {
      logger.warn(`BuiltWith enrichment failed for ${company.domain}: ${err}`);
    }
  }

  // 4. AI fallback/augmentation
  let aiData: Partial<EnrichmentResult> = {};
  if (process.env.OPENAI_API_KEY) {
    const content = company.rawContent || "";
    if (content.length >= 50) {
      try {
        const prompt = `You are a business intelligence AI. Analyze the following website content and provide comprehensive business classification data.\n\nDomain: ${company.domain}\nWebsite URL: ${company.websiteUrl || "N/A"}\n\nContent excerpt:\n${content.substring(0, 4000)}\n\nRespond ONLY with valid JSON in this EXACT format (no additional text): ...`;
        const response = await openai.chat.completions.create({
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
          } catch (parseError) {
            logger.error(`Failed to parse AI response as JSON: ${rawContent}`);
          }
        }
      } catch (error: any) {
        logger.error(`AI enrichment failed for ${company.domain}: ${error.message}`);
      }
    }
  }

  // 5. Merge all sources (priority: Clearbit > LinkedIn > BuiltWith > AI)
  const merged: EnrichmentResult = {
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
