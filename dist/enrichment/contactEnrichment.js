"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLikelyDecisionMaker = isLikelyDecisionMaker;
exports.enrichContactsForCompany = enrichContactsForCompany;
const db_1 = require("../db");
const logger_1 = require("../logger");
/**
 * Very basic name-from-email heuristic
 * TODO: Use AI + company content to improve name extraction
 * TODO: Add support for non-English name patterns
 */
function guessNameFromEmail(email) {
    const [localPart] = email.split("@");
    if (!localPart) {
        return { firstName: null, lastName: null };
    }
    // Remove numbers and split by common separators
    const cleaned = localPart.replace(/\d+/g, "").replace(/[._-]/g, " ");
    const parts = cleaned.split(" ").filter(Boolean);
    if (parts.length === 0) {
        return { firstName: null, lastName: null };
    }
    if (parts.length === 1) {
        return {
            firstName: capitalize(parts[0]),
            lastName: null,
        };
    }
    // Take first and last part
    return {
        firstName: capitalize(parts[0]),
        lastName: capitalize(parts[parts.length - 1]),
    };
}
function capitalize(s) {
    if (!s)
        return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
/**
 * Very basic "decision maker" heuristic based on role keywords
 * TODO: Use AI to infer decision-making authority from job title + company context
 * TODO: Add industry-specific decision-maker patterns
 */
const DECISION_MAKER_KEYWORDS = [
    "founder",
    "co-founder",
    "cofounder",
    "owner",
    "ceo",
    "chief executive",
    "president",
    "director",
    "managing director",
    "head of",
    "partner",
    "vp",
    "vice president",
    "c-level",
    "cto",
    "cfo",
    "cmo",
    "coo",
];
function isLikelyDecisionMaker(role) {
    if (!role)
        return false;
    const lower = role.toLowerCase();
    return DECISION_MAKER_KEYWORDS.some((kw) => lower.includes(kw));
}
/**
 * Enrich all contacts for a company with basic name and decision-maker inference
 * TODO: Add AI-based role inference from company.rawContent
 * TODO: Implement email validation and scoring
 * TODO: Add seniority level detection
 */
async function enrichContactsForCompany(company) {
    const contacts = await db_1.prisma.contact.findMany({
        where: { companyId: company.id },
    });
    if (contacts.length === 0) {
        logger_1.logger.info(`No contacts to enrich for company ${company.domain}`);
        return;
    }
    logger_1.logger.info(`Enriching ${contacts.length} contacts for company ${company.domain}`);
    for (const contact of contacts) {
        // Only guess names if not already set
        let { firstName, lastName } = contact.firstName
            ? { firstName: contact.firstName, lastName: contact.lastName }
            : guessNameFromEmail(contact.email);
        let role = contact.role ?? null;
        // TODO: Future enhancement - use AI to infer role from:
        // - company.rawContent (look for team/about pages mentioning the email/name)
        // - LinkedIn scraping
        // - Email signature parsing
        const decisionMaker = isLikelyDecisionMaker(role);
        await db_1.prisma.contact.update({
            where: { id: contact.id },
            data: {
                firstName: firstName ?? contact.firstName,
                lastName: lastName ?? contact.lastName,
                role,
                // TODO: Uncomment after running migration:
                // isLikelyDecisionMaker: decisionMaker,
            },
        });
        logger_1.logger.info(`Enriched contact ${contact.email}: ${firstName} ${lastName}, DM=${decisionMaker}`);
    }
    logger_1.logger.info(`Enriched ${contacts.length} contacts for company ${company.id}`);
}
//# sourceMappingURL=contactEnrichment.js.map