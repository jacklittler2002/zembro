"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serperSearch = serperSearch;
const axios_1 = __importDefault(require("axios"));
const logger_js_1 = require("../logger.js");
const SERPER_API_KEY = process.env.SERPER_API_KEY;
if (!SERPER_API_KEY) {
    logger_js_1.logger.warn("SERPER_API_KEY is not set; real discovery search will not work.");
}
/**
 * Search Google via Serper.dev API
 * @param query - Search query string
 * @param numPages - Number of result pages to fetch (default: 1)
 * @returns Array of search results
 */
async function serperSearch(query, numPages = 1) {
    if (!SERPER_API_KEY) {
        logger_js_1.logger.error("Cannot perform Serper search: API key not configured");
        return [];
    }
    const allResults = [];
    // Serper pagination: use "page" parameter
    // TODO: Adjust based on Serper API docs if pagination behavior changes
    for (let page = 1; page <= numPages; page++) {
        try {
            const response = await axios_1.default.post("https://google.serper.dev/search", {
                q: query,
                page,
                num: 10, // Results per page
            }, {
                headers: {
                    "X-API-KEY": SERPER_API_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 10000,
            });
            const organic = response.data?.organic ?? [];
            const pageResults = organic
                .map((item) => ({
                url: item.link,
                title: item.title,
                snippet: item.snippet,
            }))
                .filter((r) => r.url && r.url.startsWith("http"));
            allResults.push(...pageResults);
            logger_js_1.logger.info(`Serper search page ${page}/${numPages}`, {
                query,
                resultsFound: pageResults.length,
            });
        }
        catch (err) {
            logger_js_1.logger.error("Serper search error", {
                query,
                page,
                error: err.message,
            });
            // Continue to next page even if one fails
        }
    }
    logger_js_1.logger.info("Serper search completed", {
        query,
        totalResults: allResults.length,
    });
    return allResults;
}
//# sourceMappingURL=serpClient.js.map