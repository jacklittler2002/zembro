import axios from "axios";
import { logger } from "../logger.js";

const SERPER_API_KEY = process.env.SERPER_API_KEY;

if (!SERPER_API_KEY) {
  logger.warn("SERPER_API_KEY is not set; real discovery search will not work.");
}

export interface SerperResult {
  url: string;
  title: string;
  snippet: string;
}

/**
 * Search Google via Serper.dev API
 * @param query - Search query string
 * @param numPages - Number of result pages to fetch (default: 1)
 * @returns Array of search results
 */
export async function serperSearch(
  query: string,
  numPages: number = 1
): Promise<SerperResult[]> {
  if (!SERPER_API_KEY) {
    logger.error("Cannot perform Serper search: API key not configured");
    return [];
  }

  const allResults: SerperResult[] = [];

  // Serper pagination: use "page" parameter
  // TODO: Adjust based on Serper API docs if pagination behavior changes
  for (let page = 1; page <= numPages; page++) {
    try {
      const response = await axios.post(
        "https://google.serper.dev/search",
        {
          q: query,
          page,
          num: 10, // Results per page
        },
        {
          headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const organic = response.data?.organic ?? [];
      const pageResults: SerperResult[] = organic
        .map((item: any) => ({
          url: item.link as string,
          title: item.title as string,
          snippet: item.snippet as string,
        }))
        .filter((r: SerperResult) => r.url && r.url.startsWith("http"));

      allResults.push(...pageResults);

      logger.info(`Serper search page ${page}/${numPages}`, {
        query,
        resultsFound: pageResults.length,
      });
    } catch (err: any) {
      logger.error("Serper search error", {
        query,
        page,
        error: err.message,
      });
      // Continue to next page even if one fails
    }
  }

  logger.info("Serper search completed", {
    query,
    totalResults: allResults.length,
  });

  return allResults;
}
