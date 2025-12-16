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
exports.crawlDomain = crawlDomain;
const cheerio = __importStar(require("cheerio"));
const fetchPage_js_1 = require("./fetchPage.js");
const urlUtils_js_1 = require("./urlUtils.js");
const extractors_js_1 = require("./extractors.js");
const structuredExtractors_js_1 = require("./structuredExtractors.js");
const logger_js_1 = require("../logger.js");
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
async function crawlDomain(rootUrl, options = {}) {
    const maxPages = options.maxPages ?? 6; // Safe limit per domain
    const maxDepth = options.maxDepth ?? 2;
    const visited = new Set();
    const queue = [];
    // Normalize root URL
    const normalizedRoot = rootUrl.replace(/\/+$/, "");
    queue.push({ url: normalizedRoot, depth: 0 });
    // Priority queue for interesting URLs
    const priorityQueue = [];
    let allEmails = [];
    let allPhones = [];
    let fullText = "";
    let mergedSocials = {};
    let addressGuess = { rawText: null };
    let companyName = null;
    logger_js_1.logger.info("Starting domain crawl", {
        rootUrl,
        maxPages,
        maxDepth,
    });
    while ((queue.length > 0 || priorityQueue.length > 0) && visited.size < maxPages) {
        // Process priority queue first
        let url;
        let depth;
        if (priorityQueue.length > 0) {
            url = priorityQueue.shift();
            depth = 1; // Treat priority URLs as depth 1
        }
        else {
            const item = queue.shift();
            url = item.url;
            depth = item.depth;
        }
        if (visited.has(url))
            continue;
        if (depth > maxDepth)
            continue;
        visited.add(url);
        logger_js_1.logger.info("Crawling page", {
            url,
            depth,
            visitedCount: visited.size,
            queueSize: queue.length + priorityQueue.length,
        });
        // Fetch page content
        const html = await (0, fetchPage_js_1.fetchPage)(url);
        if (!html) {
            logger_js_1.logger.warn("Failed to fetch page", { url });
            continue;
        }
        // Extract data from this page
        const pageEmails = (0, extractors_js_1.extractEmails)(html);
        const pagePhones = (0, extractors_js_1.extractPhones)(html);
        const pageText = (0, extractors_js_1.extractText)(html);
        const socials = (0, structuredExtractors_js_1.extractSocialLinks)(html);
        const addr = (0, structuredExtractors_js_1.extractAddressGuess)(html);
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
            companyName = (0, structuredExtractors_js_1.extractCompanyName)(html);
        }
        // Parse internal links for more crawl targets
        const $ = cheerio.load(html);
        const links = $("a[href]");
        links.each((_, el) => {
            const href = $(el).attr("href") || "";
            const normalized = (0, urlUtils_js_1.normalizeUrl)(url, href);
            if (!normalized)
                return;
            if (visited.has(normalized))
                return;
            if ((0, urlUtils_js_1.shouldSkipUrl)(normalized))
                return;
            // Prioritize interesting paths
            if ((0, urlUtils_js_1.isInterestingPath)(normalized) && !priorityQueue.includes(normalized)) {
                priorityQueue.push(normalized);
            }
            else if (depth + 1 <= maxDepth) {
                // Add to regular queue if within depth limit
                const alreadyQueued = queue.some((item) => item.url === normalized);
                if (!alreadyQueued) {
                    queue.push({ url: normalized, depth: depth + 1 });
                }
            }
        });
        logger_js_1.logger.info("Page processed", {
            url,
            emailsFound: pageEmails.length,
            phonesFound: pagePhones.length,
            newLinksQueued: priorityQueue.length + queue.length,
        });
    }
    // Deduplicate results
    allEmails = Array.from(new Set(allEmails));
    allPhones = Array.from(new Set(allPhones));
    logger_js_1.logger.info("Domain crawl completed", {
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
//# sourceMappingURL=domainCrawler.js.map