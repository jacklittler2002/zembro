import * as cheerio from "cheerio";

export interface SocialLinks {
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
}

export interface AddressGuess {
  rawText: string | null;
}

/**
 * Extract social media links from HTML
 * Looks for common social media domain patterns in anchor tags
 * 
 * @param html - Raw HTML content
 * @returns Object with found social media URLs
 */
export function extractSocialLinks(html: string): SocialLinks {
  const $ = cheerio.load(html);
  const links = $("a[href]");
  const socials: SocialLinks = {};

  links.each((_, el) => {
    const href = $(el).attr("href") || "";
    const lower = href.toLowerCase();

    // LinkedIn
    if (lower.includes("linkedin.com") && !socials.linkedin) {
      socials.linkedin = href;
    }

    // Facebook
    if ((lower.includes("facebook.com") || lower.includes("fb.me")) && !socials.facebook) {
      socials.facebook = href;
    }

    // Twitter/X
    if (
      (lower.includes("twitter.com") || lower.includes("x.com")) &&
      !socials.twitter
    ) {
      socials.twitter = href;
    }

    // Instagram
    if (
      (lower.includes("instagram.com") || lower.includes("instagr.am")) &&
      !socials.instagram
    ) {
      socials.instagram = href;
    }
  });

  return socials;
}

/**
 * Attempt to extract address-like text from HTML
 * Very rough heuristic: looks for lines with numbers and street keywords
 * 
 * TODO: Improve with:
 * - Postal code pattern matching (UK: SW1A 1AA, US: 12345)
 * - Structured data extraction (schema.org, microdata)
 * - NLP/NER for better address recognition
 * - Country/city database validation
 * 
 * @param html - Raw HTML content
 * @returns Best guess for address text
 */
export function extractAddressGuess(html: string): AddressGuess {
  const $ = cheerio.load(html);

  // First try: look for address tags or microdata
  const addressTags = $('address, [itemprop="address"], [class*="address"]');
  if (addressTags.length > 0) {
    const addressText = addressTags.first().text().trim();
    if (addressText && addressText.length < 300) {
      return { rawText: addressText };
    }
  }

  // Fallback: heuristic text search
  const text = $("body").text();
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates = lines.filter((line) => {
    const hasNumber = /\d/.test(line);
    const hasStreetWord = /(street|st\.|road|rd\.|avenue|ave\.|lane|ln\.|way|square|sq\.|park|close|drive|dr\.|court|ct\.|place|pl\.)/i.test(
      line
    );
    const hasPostcode = /\b[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\b/i.test(line); // UK postcode pattern
    const notTooLong = line.length < 200;
    const notTooShort = line.length > 10;

    return (hasNumber && hasStreetWord && notTooLong && notTooShort) || hasPostcode;
  });

  return {
    rawText: candidates[0] || null,
  };
}

/**
 * Extract company name from HTML
 * Looks in common locations: title, h1, meta tags
 * 
 * @param html - Raw HTML content
 * @returns Extracted company name or null
 */
export function extractCompanyName(html: string): string | null {
  const $ = cheerio.load(html);

  // Try meta tags first
  const ogSiteName = $('meta[property="og:site_name"]').attr("content");
  if (ogSiteName && ogSiteName.length < 100) return ogSiteName.trim();

  // Try title tag (remove common suffixes)
  let title = $("title").text().trim();
  if (title) {
    // Remove common suffixes like " - Home", " | Welcome", etc.
    title = title.replace(/\s*[-|]\s*(Home|Welcome|Official Site).*$/i, "").trim();
    if (title.length > 0 && title.length < 100) return title;
  }

  // Try first h1
  const h1 = $("h1").first().text().trim();
  if (h1 && h1.length < 100) return h1;

  return null;
}

/**
 * Extract business hours from HTML (rough heuristic)
 * TODO: Improve with structured data parsing and NLP
 * 
 * @param html - Raw HTML content
 * @returns Array of text lines that might be business hours
 */
export function extractBusinessHours(html: string): string[] {
  const $ = cheerio.load(html);
  const text = $("body").text();
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  const hourPatterns = [
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i,
    /\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)\b/,
    /\b\d{1,2}\s*(am|pm|AM|PM)\s*-\s*\d{1,2}\s*(am|pm|AM|PM)\b/,
  ];

  const candidates = lines.filter((line) => {
    return hourPatterns.some((pattern) => pattern.test(line)) && line.length < 150;
  });

  return candidates.slice(0, 7); // Max one per day of week
}
