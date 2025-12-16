"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEnrichmentJob = handleEnrichmentJob;
const db_1 = require("../db");
const logger_1 = require("../logger");
const enrichCompany_1 = require("./enrichCompany");
const contactEnrichment_1 = require("./contactEnrichment");
async function handleEnrichmentJob(job) {
    if (!job.companyId) {
        logger_1.logger.warn("ENRICHMENT job without companyId", job.id);
        return;
    }
    const company = await db_1.prisma.company.findUnique({
        where: { id: job.companyId },
    });
    if (!company) {
        logger_1.logger.warn("ENRICHMENT job with non-existent company", job.companyId);
        return;
    }
    logger_1.logger.info(`Starting AI enrichment for ${company.domain}`);
    const result = await (0, enrichCompany_1.enrichCompany)(company);
    // Validate sizeBucket enum value
    const VALID_SIZE_BUCKETS = ["MICRO", "SMALL", "SMB", "MIDMARKET", "ENTERPRISE"];
    const validatedSizeBucket = result.sizeBucket && VALID_SIZE_BUCKETS.includes(result.sizeBucket)
        ? result.sizeBucket
        : company.sizeBucket;
    await db_1.prisma.company.update({
        where: { id: company.id },
        data: {
            // V1 fields
            category: result.category ?? company.category,
            niche: result.niche ?? company.niche,
            tags: result.tags.length > 0 ? result.tags : company.tags,
            aiConfidence: result.confidence ?? company.aiConfidence,
            // V2 enrichment fields
            industry: result.industry ?? company.industry,
            sizeBucket: validatedSizeBucket,
            hqCity: result.hqCity ?? company.hqCity,
            hqCountry: result.hqCountry ?? company.hqCountry,
            businessType: result.businessType ?? company.businessType,
            keywords: result.keywords.length > 0 ? result.keywords : company.keywords,
            idealCustomerNotes: result.idealCustomerNotes ?? company.idealCustomerNotes,
        },
    });
    logger_1.logger.info(`Enriched company ${company.domain} with category=${result.category}, industry=${result.industry}, size=${validatedSizeBucket}, confidence=${result.confidence}`);
    // After updating the company, run contact enrichment
    await (0, contactEnrichment_1.enrichContactsForCompany)(company);
}
//# sourceMappingURL=handleEnrichmentJob.js.map