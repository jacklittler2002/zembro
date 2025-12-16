/**
 * Normalize email to lowercase and trim whitespace
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate email format using regex
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check if email is likely a quality lead
 * Filters out generic admin/support emails
 */
export function isLeadQualityEmail(email: string): boolean {
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
