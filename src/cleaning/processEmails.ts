import {
  normalizeEmail,
  isValidEmail,
  isLeadQualityEmail,
} from "./cleanEmail";

/**
 * Process raw extracted emails:
 * - Normalize (lowercase, trim)
 * - Validate format
 * - Deduplicate
 * - Filter for lead quality
 */
export function processExtractedEmails(rawEmails: string[]): {
  cleaned: string[];
  highQuality: string[];
} {
  const normalized = rawEmails.map(normalizeEmail).filter(isValidEmail);

  const unique = Array.from(new Set(normalized));

  const highQuality = unique.filter(isLeadQualityEmail);

  return {
    cleaned: unique,
    highQuality,
  };
}
