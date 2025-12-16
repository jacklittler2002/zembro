"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreCompany = scoreCompany;
/**
 * Calculate a quality score (0-100) for a company based on extracted data
 * MVP version - will be replaced with AI enrichment later
 */
function scoreCompany(emails, phones, text) {
    let score = 0;
    // Has contact information
    if (emails.length > 0)
        score += 30;
    if (phones.length > 0)
        score += 20;
    // Content quality indicators
    if (text.length > 100)
        score += 20; // decent amount of content
    if (text.includes("about"))
        score += 10; // suggests real business
    if (text.includes("contact"))
        score += 10; // has contact page
    return Math.min(score, 100);
}
//# sourceMappingURL=scoreCompany.js.map