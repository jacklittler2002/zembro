import { serperSearch } from "./serpClient.js";
import { normalizeDomainFromUrl, isLikelyBusinessDomain } from "../utils/domainUtils.js";
import { logger } from "../logger.js";
import { buildDiscoveryQueries } from "./queryVariants.js";

export interface DiscoveredSite {
  url: string;
  domain: string;
  title?: string;
  snippet?: string;
}

export interface DiscoveryOptions {
  /** Number of result pages to fetch per query (default: 1) */
  pagesPerQuery?: number;
  /** Maximum total results to return (default: 100) */
  maxResults?: number;
}

/**
 * Discover candidate business sites using web search
 * 
 * This function:
 * 1. Generates multiple query variants
 * 2. Searches each variant via Serper API
 * 3. Normalizes and filters domains
 * 4. Deduplicates by domain
 * 5. Returns up to maxResults sites
 * 
 * @param baseQuery - Original search query (e.g., "dentists in London")
 * @param options - Discovery configuration options
 * @returns Array of discovered sites with normalized domains
 */
export async function discoverCandidateSites(
  baseQuery: string,
  options: DiscoveryOptions = {}
): Promise<DiscoveredSite[]> {
  const pagesPerQuery = options.pagesPerQuery ?? 1;
  const maxResults = options.maxResults ?? 100;

  const queries = buildDiscoveryQueries(baseQuery);
  logger.info("Running discovery with query variants", {
    baseQuery,
    variantCount: queries.length,
    queries,
    pagesPerQuery,
    maxResults,
  });

  let all: DiscoveredSite[] = [];

  // 1. Serper (Google/Bing)
  for (const q of queries) {
    const results = await serperSearch(q, pagesPerQuery);
    for (const r of results) {
      const domain = normalizeDomainFromUrl(r.url);
      if (!domain) continue;
      if (!isLikelyBusinessDomain(domain)) continue;
      all.push({ url: r.url, domain, title: r.title, snippet: r.snippet });
    }
  }

  // 2. LinkedIn (API or scraping)
  if (process.env.LINKEDIN_API_KEY) {
    try {
      // TODO: Implement LinkedIn company search here
      // const linkedinResults = await fetchLinkedInCompanies(baseQuery)
      // all.push(...linkedinResults)
    } catch (err) {
      logger.warn(`LinkedIn discovery failed: ${err}`);
    }
  }

  // 3. Apollo.io (API)
  if (process.env.APOLLO_API_KEY) {
    try {
      // TODO: Implement Apollo company search here
      // const apolloResults = await fetchApolloCompanies(baseQuery)
      // all.push(...apolloResults)
    } catch (err) {
      logger.warn(`Apollo discovery failed: ${err}`);
    }
  }

  // 4. BuiltWith/Wappalyzer (tech stack search)
  if (process.env.BUILTWITH_API_KEY) {
    try {
      // TODO: Implement BuiltWith search here
      // const builtWithResults = await fetchBuiltWithCompanies(baseQuery)
      // all.push(...builtWithResults)
    } catch (err) {
      logger.warn(`BuiltWith discovery failed: ${err}`);
    }
  }

  logger.info("Discovery collected raw results", {
    baseQuery,
    totalBeforeDedup: all.length,
  });

  // Deduplicate by domain, keeping first occurrence
  const byDomain = new Map<string, DiscoveredSite>();
  for (const site of all) {
    if (!byDomain.has(site.domain)) {
      byDomain.set(site.domain, site);
    }
  }

  const deduped = Array.from(byDomain.values());

  logger.info("Discovery deduplicated results", {
    baseQuery,
    totalAfterDedup: deduped.length,
    uniqueDomains: deduped.length,
  });

  // Limit to maxResults
  if (deduped.length > maxResults) {
    logger.info("Limiting discovery results to maxResults", {
      found: deduped.length,
      maxResults,
    });
    return deduped.slice(0, maxResults);
  }

  return deduped;
}

/**
 * Score a discovered site based on relevance indicators
 * Higher score = more likely to be relevant
 * 
 * TODO: Implement sophisticated scoring using:
 * - Query term matches in title/snippet
 * - Domain quality indicators
 * - Page rank proxies
 * - ML model predictions
 */
export function scoreDiscoveredSite(
  site: DiscoveredSite,
  baseQuery: string
): number {
  let score = 0;

  // Basic scoring heuristics
  const queryTerms = baseQuery.toLowerCase().split(/\s+/);
  
  if (site.title) {
    const titleLower = site.title.toLowerCase();
    queryTerms.forEach(term => {
      if (titleLower.includes(term)) score += 2;
    });
  }

  if (site.snippet) {
    const snippetLower = site.snippet.toLowerCase();
    queryTerms.forEach(term => {
      if (snippetLower.includes(term)) score += 1;
    });
  }

  // Prefer .com and .co.uk domains
  if (site.domain.endsWith(".com")) score += 1;
  if (site.domain.endsWith(".co.uk")) score += 1;

  return score;
}
