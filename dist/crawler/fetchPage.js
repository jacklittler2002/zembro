"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPage = fetchPage;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../logger");
async function fetchPage(url) {
    try {
        const response = await axios_1.default.get(url, {
            timeout: 8000, // 8 seconds is enough
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; ZembroBot/1.0; +https://zembro.co.uk)",
            },
            validateStatus: () => true,
        });
        if (response.status >= 200 && response.status < 300) {
            return response.data;
        }
        logger_1.logger.warn(`fetchPage: ${url} returned status ${response.status}`);
        return null;
    }
    catch (err) {
        logger_1.logger.error("fetchPage error for url:", url, err);
        return null;
    }
}
//# sourceMappingURL=fetchPage.js.map