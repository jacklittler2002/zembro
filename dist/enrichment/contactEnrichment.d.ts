import { Company } from "@prisma/client";
export declare function isLikelyDecisionMaker(role: string | null | undefined): boolean;
/**
 * Enrich all contacts for a company with basic name and decision-maker inference
 * TODO: Add AI-based role inference from company.rawContent
 * TODO: Implement email validation and scoring
 * TODO: Add seniority level detection
 */
export declare function enrichContactsForCompany(company: Company): Promise<void>;
//# sourceMappingURL=contactEnrichment.d.ts.map