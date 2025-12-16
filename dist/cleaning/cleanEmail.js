"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
exports.isValidEmail = isValidEmail;
exports.isLeadQualityEmail = isLeadQualityEmail;
/**
 * Normalize email to lowercase and trim whitespace
 */
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
/**
 * Validate email format using regex
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
/**
 * Check if email is likely a quality lead
 * Filters out generic admin/support emails
 */
function isLeadQualityEmail(email) {
    const badPatterns = [
        "admin@",
        "office@",
        "info@",
        "support@",
        "contact@",
        "hello@",
        "enquiries@",
        "sales@",
        "team@",
        "mail@",
        "noreply@",
        "no-reply@",
    ];
    return !badPatterns.some((p) => email.includes(p));
}
//# sourceMappingURL=cleanEmail.js.map