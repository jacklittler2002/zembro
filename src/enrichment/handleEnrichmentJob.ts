import { prisma } from "../db";
import { logger } from "../logger";
import { enrichCompany } from "./enrichCompany";
import { enrichContactsForCompany } from "./contactEnrichment";
import { CrawlJob } from "../jobs/jobTypes";

export async function handleEnrichmentJob(job: CrawlJob) {
  if (!job.companyId) {
    logger.warn("ENRICHMENT job without companyId", job.id);
    return;
  }

  const company = await prisma.company.findUnique({
    where: { id: job.companyId },
  });

  if (!company) {
    logger.warn("ENRICHMENT job with non-existent company", job.companyId);
    return;
  }

  logger.info(`Starting AI enrichment for ${company.domain}`);

  const result = await enrichCompany(company);

  // Validate sizeBucket enum value
  const VALID_SIZE_BUCKETS = ["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"];
  const validatedSizeBucket =
    result.sizeBucket && VALID_SIZE_BUCKETS.includes(result.sizeBucket)
      ? result.sizeBucket
      : company.sizeBucket;

  await prisma.company.update({
    where: { id: company.id },
    data: {
      // V1 fields
      category: result.category ?? company.category,
      niche: result.niche ?? company.niche,
      tags: result.tags.length > 0 ? result.tags : company.tags,
      aiConfidence: result.confidence ?? company.aiConfidence,

      // V2 enrichment fields
      industry: result.industry ?? company.industry,
      sizeBucket: validatedSizeBucket as any,
      hqCity: result.hqCity ?? company.hqCity,
      hqCountry: result.hqCountry ?? company.hqCountry,
      businessType: result.businessType ?? company.businessType,
      keywords: result.keywords.length > 0 ? result.keywords : company.keywords,
      idealCustomerNotes:
        result.idealCustomerNotes ?? company.idealCustomerNotes,
    },
  });

  logger.info(
    `Enriched company ${company.domain} with category=${result.category}, industry=${result.industry}, size=${validatedSizeBucket}, confidence=${result.confidence}`
  );

  // After updating the company, run contact enrichment
  await enrichContactsForCompany(company);

  // Increment enrichedCount on LeadSearch if present
  if (job.leadSearchId) {
    await prisma.leadSearch.update({
      where: { id: job.leadSearchId },
      data: {
        enrichedCount: { increment: 1 },
      },
    });
    // Check for completion
    const { maybeMarkLeadSearchDone } = await import("../leadSearch/leadSearchProgressService");
    await maybeMarkLeadSearchDone(job.leadSearchId);
  }
}
