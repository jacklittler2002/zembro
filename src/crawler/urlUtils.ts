/**
 * Normalize a URL relative to a base URL
 * Filters out non-HTTP links and ensures same-domain only
 * 
 * @param baseUrl - The base URL of the page
 * @param href - The href attribute value
 * @returns Normalized absolute URL or null if invalid/external
 */
export function normalizeUrl(baseUrl: string, href: string): string | null {
  try {
    if (!href) return null;

    // Ignore anchors / mailto / tel / javascript
    if (href.startsWith("#")) return null;
    if (href.startsWith("mailto:")) return null;
    if (href.startsWith("tel:")) return null;
    if (href.toLowerCase().startsWith("javascript:")) return null;

    const base = new URL(baseUrl);
    const url = new URL(href, base);

    // Only keep same-domain URLs
    if (url.hostname !== base.hostname) return null;

    // Normalize: strip hash, normalize trailing slash
    url.hash = "";
    const normalized = url.toString().replace(/\/+$/, "");

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Keywords that indicate interesting pages for contact/business info
 */
const INTERESTING_PATH_KEYWORDS = [
  "contact",
  "about",
  "team",
  "staff",
  "people",
  "services",
  "service",
  "locations",
  "location",
  "branch",
  "branches",
  "clinic",
  "clinics",
  "office",
  "offices",
  "find-us",
  "visit",
  "address",
  "reach",
  "get-in-touch",
];

/**
 * Check if a URL path contains interesting keywords
 * Used to prioritize crawling pages likely to have contact info
 * 
 * @param url - Full URL to check
 * @returns true if URL path contains interesting keywords
 */
export function isInterestingPath(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();

    return INTERESTING_PATH_KEYWORDS.some((kw) => path.includes(kw));
  } catch {
    return false;
  }
}

/**
 * Patterns for URLs to skip during crawling
 */
const SKIP_URL_PATTERNS = [
  /\.(pdf|jpg|jpeg|png|gif|svg|ico|css|js|xml|json)$/i,
  /\/wp-admin\//i,
  /\/wp-content\//i,
  /\/feed\//i,
  /\/print\//i,
  /\/share\//i,
  /\/download\//i,
  /\?utm_/i, // Skip tracking URLs
];

/**
 * Check if URL should be skipped based on common patterns
 * @param url - URL to check
 * @returns true if URL should be skipped
 */
export function shouldSkipUrl(url: string): boolean {
  return SKIP_URL_PATTERNS.some((pattern) => pattern.test(url));
}
