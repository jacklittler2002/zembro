import { Company } from "@prisma/client";
export interface EnrichmentResult {
    category: string | null;
    niche: string | null;
    tags: string[];
    confidence: number | null;
    industry: string | null;
    sizeBucket: string | null;
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
export declare function enrichCompany(company: Company): Promise<EnrichmentResult>;
//# sourceMappingURL=enrichCompany.d.ts.map