import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { CrawlJob } from "../jobs/jobTypes.js";
import { processExtractedEmails } from "../cleaning/processEmails.js";
import { scoreCompany } from "../scoring/scoreCompany.js";
import { enqueueJob } from "../jobs/jobService.js";
import { crawlDomain } from "./domainCrawler.js";
import { normalizeDomainFromUrl, isLikelyBusinessDomain } from "../utils/domainUtils.js";

export async function handleSiteCrawl(job: CrawlJob) {
  if (!job.companyId || !job.targetUrl) {
    logger.warn("SITE_CRAWL job missing companyId or targetUrl", { jobId: job.id });
    return;
  }

  const company = await prisma.company.findUnique({
    where: { id: job.companyId },
  });

  if (!company) {
    logger.warn("SITE_CRAWL job with non-existent company", { companyId: job.companyId });
    return;
  }

  // Validate domain before crawling
  const baseUrl = job.targetUrl.replace(/\/+$/, "");
  const domain = normalizeDomainFromUrl(baseUrl);

  if (!domain || !isLikelyBusinessDomain(domain)) {
    logger.info("Skipping SITE_CRAWL for non-business domain", {
      domain,
      companyId: company.id,
    });
    return;
  }

  logger.info("Starting SITE_CRAWL", {
    companyId: company.id,
    domain: company.domain,
    targetUrl: baseUrl,
  });

  // Use smart domain crawler instead of fixed URL list
  const crawlResult = await crawlDomain(baseUrl, {
    maxPages: 6, // TODO: Make this configurable per subscription plan
  });

  // Clean and deduplicate emails using cleaning pipeline
  const { cleaned, highQuality } = processExtractedEmails(crawlResult.emails);
  const emails = cleaned;
  const phones = crawlResult.phones;
  const textContent = crawlResult.textContent;
  const socials = crawlResult.socialLinks;
  const addr = crawlResult.addressGuess;
  const extractedName = crawlResult.companyName;

  // Trim text content for storage (15000 chars max)
  const trimmedContent = textContent.slice(0, 15000);

  // Calculate quality score
  const score = scoreCompany(emails, phones, textContent);

  // Determine best company name (prefer extracted over domain)
  const bestName = extractedName || company.name;

  // Update company info with crawl results
  await prisma.company.update({
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


  // Insert contacts (emails)
  let newContactsCreated = 0;
  for (const email of emails) {
    const contact = await prisma.contact.upsert({
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
  }

  // Increment crawledCount and contactsFoundCount on LeadSearch
  if (job.leadSearchId) {
    await prisma.leadSearch.update({
      where: { id: job.leadSearchId },
      data: {
        crawledCount: { increment: 1 },
        contactsFoundCount: { increment: newContactsCreated },
      },
    });
    // Check for completion
    const { maybeMarkLeadSearchDone } = await import("../leadSearch/leadSearchProgressService");
    await maybeMarkLeadSearchDone(job.leadSearchId);
  }

  logger.info(
    `SITE_CRAWL completed for ${company.domain}: pages=${crawlResult.pagesVisited}, emails=${emails.length} (${highQuality.length} high-quality), phones=${phones.length}, score=${score}`
  );

  logger.info("Social links found", {
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
  const existingEnrichment = await prisma.crawlJob.findFirst({
    where: {
      companyId: company.id,
      type: "ENRICHMENT",
      status: { in: ["PENDING", "RUNNING"] },
    },
  });

  if (!existingEnrichment) {
    await enqueueJob({
      type: "ENRICHMENT",
      companyId: company.id,
      targetUrl: null,
      leadSearchId: job.leadSearchId ?? null,
    });
    logger.info(`Enqueued ENRICHMENT job for ${company.domain}`);
  }
}
