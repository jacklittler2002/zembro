/**
 * Normalize a URL to its base domain
 * - Removes www prefix
 * - Converts to lowercase
 * - Handles invalid URLs gracefully
 */
export function normalizeDomain(url: string): string {
  try {
    let domain = new URL(url).hostname.toLowerCase();
    domain = domain.replace(/^www\./, "");
    return domain;
  } catch {
    return url.toLowerCase();
  }
}
