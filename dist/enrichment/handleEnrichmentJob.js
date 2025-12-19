"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    // Increment enrichedCount on LeadSearch if present
    if (job.leadSearchId) {
        await db_1.prisma.leadSearch.update({
            where: { id: job.leadSearchId },
            data: {
                enrichedCount: { increment: 1 },
            },
        });
        // Check for completion
        const { maybeMarkLeadSearchDone } = await Promise.resolve().then(() => __importStar(require("../leadSearch/leadSearchProgressService")));
        await maybeMarkLeadSearchDone(job.leadSearchId);
    }
}
//# sourceMappingURL=handleEnrichmentJob.js.map