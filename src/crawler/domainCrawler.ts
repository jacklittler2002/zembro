import * as cheerio from "cheerio";
import { fetchPage } from "./fetchPage.js";
import { normalizeUrl, isInterestingPath, shouldSkipUrl } from "./urlUtils.js";
import { extractEmails, extractPhones, extractText } from "./extractors.js";
import {
  extractSocialLinks,
  extractAddressGuess,
  extractCompanyName,
  SocialLinks,
  AddressGuess,
} from "./structuredExtractors.js";
import { logger } from "../logger.js";

export interface CrawlResult {
  emails: string[];
  phones: string[];
  textContent: string;
  socialLinks: SocialLinks;
  addressGuess: AddressGuess;
  companyName: string | null;
  pagesVisited: number;
}

export interface CrawlOptions {
  /** Maximum number of pages to crawl per domain (default: 6) */
  maxPages?: number;
  /** Maximum depth from root (default: 2) */
  maxDepth?: number;
}

/**
 * Crawl a domain using a breadth-first approach
 * Prioritizes pages with interesting paths (contact, about, etc.)
 * 
 * This performs a bounded multi-page crawl to extract:
 * - Email addresses
 * - Phone numbers
 * - Social media links
 * - Address information
 * - Company name
 * - Full text content
 * 
 * TODO: Make maxPages configurable per subscription plan
 * TODO: Add caching to avoid re-crawling recently visited pages
 * TODO: Implement robots.txt respect
 * TODO: Add concurrent page fetching with rate limiting
 * 
 * @param rootUrl - Base URL of the domain to crawl
 * @param options - Crawl configuration options
 * @returns Aggregated crawl results
 */
export async function crawlDomain(
  rootUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const maxPages = options.maxPages ?? 6; // Safe limit per domain
  const maxDepth = options.maxDepth ?? 2;

  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [];

  // Normalize root URL
  const normalizedRoot = rootUrl.replace(/\/+$/, "");
  queue.push({ url: normalizedRoot, depth: 0 });

  // Priority queue for interesting URLs
  const priorityQueue: string[] = [];

  let allEmails: string[] = [];
  let allPhones: string[] = [];
  let fullText = "";
  let mergedSocials: SocialLinks = {};
  let addressGuess: AddressGuess = { rawText: null };
  let companyName: string | null = null;

  logger.info("Starting domain crawl", {
    rootUrl,
    maxPages,
    maxDepth,
  });

  while ((queue.length > 0 || priorityQueue.length > 0) && visited.size < maxPages) {
    // Process priority queue first
    let url: string;
    let depth: number;

    if (priorityQueue.length > 0) {
      url = priorityQueue.shift()!;
      depth = 1; // Treat priority URLs as depth 1
    } else {
      const item = queue.shift()!;
      url = item.url;
      depth = item.depth;
    }

    if (visited.has(url)) continue;
    if (depth > maxDepth) continue;

    visited.add(url);

    logger.info("Crawling page", {
      url,
      depth,
      visitedCount: visited.size,
      queueSize: queue.length + priorityQueue.length,
    });

    // Fetch page content
    const html = await fetchPage(url);
    if (!html) {
      logger.warn("Failed to fetch page", { url });
      continue;
    }

    // Extract data from this page
    const pageEmails = extractEmails(html);
    const pagePhones = extractPhones(html);
    const pageText = extractText(html);
    const socials = extractSocialLinks(html);
    const addr = extractAddressGuess(html);

    // Aggregate results
    allEmails.push(...pageEmails);
    allPhones.push(...pagePhones);
    fullText += " " + pageText;

    // Merge social links (keep first found)
    if (!mergedSocials.linkedin && socials.linkedin) {
      mergedSocials.linkedin = socials.linkedin;
    }
    if (!mergedSocials.facebook && socials.facebook) {
      mergedSocials.facebook = socials.facebook;
    }
    if (!mergedSocials.twitter && socials.twitter) {
      mergedSocials.twitter = socials.twitter;
    }
    if (!mergedSocials.instagram && socials.instagram) {
      mergedSocials.instagram = socials.instagram;
    }

    // Keep first address found
    if (!addressGuess.rawText && addr.rawText) {
      addressGuess = addr;
    }

    // Extract company name from homepage if not yet found
    if (!companyName && depth === 0) {
      companyName = extractCompanyName(html);
    }

    // Parse internal links for more crawl targets
    const $ = cheerio.load(html);
    const links = $("a[href]");

    links.each((_, el) => {
      const href = $(el).attr("href") || "";
      const normalized = normalizeUrl(url, href);

      if (!normalized) return;
      if (visited.has(normalized)) return;
      if (shouldSkipUrl(normalized)) return;

      // Prioritize interesting paths
      if (isInterestingPath(normalized) && !priorityQueue.includes(normalized)) {
        priorityQueue.push(normalized);
      } else if (depth + 1 <= maxDepth) {
        // Add to regular queue if within depth limit
        const alreadyQueued = queue.some((item) => item.url === normalized);
        if (!alreadyQueued) {
          queue.push({ url: normalized, depth: depth + 1 });
        }
      }
    });

    logger.info("Page processed", {
      url,
      emailsFound: pageEmails.length,
      phonesFound: pagePhones.length,
      newLinksQueued: priorityQueue.length + queue.length,
    });
  }

  // Deduplicate results
  allEmails = Array.from(new Set(allEmails));
  allPhones = Array.from(new Set(allPhones));

  logger.info("Domain crawl completed", {
    rootUrl,
    pagesVisited: visited.size,
    emailsFound: allEmails.length,
    phonesFound: allPhones.length,
    hasSocials: Object.keys(mergedSocials).length > 0,
    hasAddress: !!addressGuess.rawText,
    hasCompanyName: !!companyName,
  });

  return {
    emails: allEmails,
    phones: allPhones,
    textContent: fullText.trim(),
    socialLinks: mergedSocials,
    addressGuess,
    companyName,
    pagesVisited: visited.size,
  };
}
