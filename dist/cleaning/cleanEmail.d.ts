/**
 * Normalize email to lowercase and trim whitespace
 */
export declare function normalizeEmail(email: string): string;
/**
 * Validate email format using regex
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Check if email is likely a quality lead
 * Filters out generic admin/support emails
 */
export declare function isLeadQualityEmail(email: string): boolean;
//# sourceMappingURL=cleanEmail.d.ts.map