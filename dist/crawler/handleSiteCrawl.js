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
exports.handleSiteCrawl = handleSiteCrawl;
const db_js_1 = require("../db.js");
const logger_1 = require("../logger");
const processEmails_js_1 = require("../cleaning/processEmails.js");
const scoreCompany_js_1 = require("../scoring/scoreCompany.js");
const jobService_js_1 = require("../jobs/jobService.js");
const domainCrawler_js_1 = require("./domainCrawler.js");
const domainUtils_js_1 = require("../utils/domainUtils.js");
async function handleSiteCrawl(job) {
    if (!job.companyId || !job.targetUrl) {
        logger_1.logger.warn("SITE_CRAWL job missing companyId or targetUrl", { jobId: job.id });
        return;
    }
    const company = await db_js_1.prisma.company.findUnique({
        where: { id: job.companyId },
    });
    if (!company) {
        logger_1.logger.warn("SITE_CRAWL job with non-existent company", { companyId: job.companyId });
        return;
    }
    // Validate domain before crawling
    const baseUrl = job.targetUrl.replace(/\/+$/, "");
    const domain = (0, domainUtils_js_1.normalizeDomainFromUrl)(baseUrl);
    if (!domain || !(0, domainUtils_js_1.isLikelyBusinessDomain)(domain)) {
        logger_1.logger.info("Skipping SITE_CRAWL for non-business domain", {
            domain,
            companyId: company.id,
        });
        return;
    }
    logger_1.logger.info("Starting SITE_CRAWL", {
        companyId: company.id,
        domain: company.domain,
        targetUrl: baseUrl,
    });
    // Use smart domain crawler instead of fixed URL list
    const crawlResult = await (0, domainCrawler_js_1.crawlDomain)(baseUrl, {
        maxPages: 6, // TODO: Make this configurable per subscription plan
    });
    // Clean and deduplicate emails using cleaning pipeline
    const { cleaned, highQuality } = (0, processEmails_js_1.processExtractedEmails)(crawlResult.emails);
    const emails = cleaned;
    const phones = crawlResult.phones;
    const textContent = crawlResult.textContent;
    const socials = crawlResult.socialLinks;
    const addr = crawlResult.addressGuess;
    const extractedName = crawlResult.companyName;
    // Trim text content for storage (15000 chars max)
    const trimmedContent = textContent.slice(0, 15000);
    // Calculate quality score
    const score = (0, scoreCompany_js_1.scoreCompany)(emails, phones, textContent);
    // Determine best company name (prefer extracted over domain)
    const bestName = extractedName || company.name;
    // Update company info with crawl results
    await db_js_1.prisma.company.update({
        where: { id: company.id },
        data: {
            name: bestName,
            phone: phones[0] || company.phone,
            lastCrawledAt: new Date(),
            aiConfidence: score,
            rawContent: trimmedContent,
            // TODO: Uncomment after running migration:
            // linkedinUrl: socials.linkedin ?? company.linkedinUrl,
            // facebookUrl: socials.facebook ?? company.facebookUrl,
            // twitterUrl: socials.twitter ?? company.twitterUrl,
            // instagramUrl: socials.instagram ?? company.instagramUrl,
            // addressRaw: addr.rawText ?? company.addressRaw,
        },
    });
    // Insert contacts (emails) and process for delivery
    let newContactsCreated = 0;
    const contactsToProcess = [];
    for (const email of emails) {
        const contact = await db_js_1.prisma.contact.upsert({
            where: {
                email_companyId: {
                    email,
                    companyId: company.id,
                },
            },
            update: {
                source: "site_crawl",
            },
            create: {
                email,
                companyId: company.id,
                source: "site_crawl",
            },
        });
        if (contact.createdAt.getTime() === contact.updatedAt.getTime()) {
            newContactsCreated++;
        }
        // Collect contacts for processing
        contactsToProcess.push({
            id: contact.id,
            email: contact.email,
            company: {
                id: company.id,
                domain: company.domain,
                websiteUrl: company.websiteUrl,
                name: company.name,
                city: company.city,
                country: company.country,
                googleMapsPlaceId: null, // TODO: Add when available
            },
        });
    }
    // Process contacts through Instantly-style credit system
    let deliveryResult = null;
    if (job.leadSearchId && contactsToProcess.length > 0) {
        const { InstantlyCreditService } = await Promise.resolve().then(() => __importStar(require("../leadSearch/instantlyCreditService")));
        // Get the user ID for this lead search
        const leadSearch = await db_js_1.prisma.leadSearch.findUnique({
            where: { id: job.leadSearchId },
            select: { userId: true },
        });
        if (leadSearch) {
            deliveryResult = await InstantlyCreditService.processLeadDelivery(leadSearch.userId, job.leadSearchId, contactsToProcess);
        }
    }
    // Update LeadSearch counters
    if (job.leadSearchId) {
        const updateData = {
            crawledCount: { increment: 1 },
        };
        // Use delivery result if available, otherwise fall back to simple counting
        if (deliveryResult) {
            updateData.contactsFoundCount = { increment: deliveryResult.totalFound };
        }
        else {
            updateData.contactsFoundCount = { increment: newContactsCreated };
        }
        await db_js_1.prisma.leadSearch.update({
            where: { id: job.leadSearchId },
            data: updateData,
        });
        // Check for completion
        const { maybeMarkLeadSearchDone } = await Promise.resolve().then(() => __importStar(require("../leadSearch/leadSearchProgressService")));
        await maybeMarkLeadSearchDone(job.leadSearchId);
    }
    logger_1.logger.info(`SITE_CRAWL completed for ${company.domain}: pages=${crawlResult.pagesVisited}, emails=${emails.length} (${highQuality.length} high-quality), phones=${phones.length}, score=${score}`);
    logger_1.logger.info("Social links found", {
        companyDomain: company.domain,
        socials: {
            linkedin: !!socials.linkedin,
            facebook: !!socials.facebook,
            twitter: !!socials.twitter,
            instagram: !!socials.instagram,
        },
        hasAddress: !!addr.rawText,
    });
    // Enqueue ENRICHMENT job if not already pending/running
    const existingEnrichment = await db_js_1.prisma.crawlJob.findFirst({
        where: {
            companyId: company.id,
            type: "ENRICHMENT",
            status: { in: ["PENDING", "RUNNING"] },
        },
    });
    if (!existingEnrichment) {
        await (0, jobService_js_1.enqueueJob)({
            type: "ENRICHMENT",
            companyId: company.id,
            targetUrl: null,
            leadSearchId: job.leadSearchId ?? null,
        });
        logger_1.logger.info(`Enqueued ENRICHMENT job for ${company.domain}`);
    }
}
//# sourceMappingURL=handleSiteCrawl.js.map