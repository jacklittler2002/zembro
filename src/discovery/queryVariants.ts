/**
 * Generate multiple search query variants for better discovery coverage
 * Takes a base query and creates semantic variations
 * 
 * @param baseQuery - Original search query (e.g., "dentists in London")
 * @returns Array of unique query variants
 * 
 * TODO: Use AI (GPT-4) to generate smarter, context-aware variants
 * TODO: Consider location expansions (e.g., "London" -> "London UK", "Greater London")
 * TODO: Add industry-specific patterns (e.g., for healthcare, retail, B2B)
 */
export function buildDiscoveryQueries(baseQuery: string): string[] {
  const trimmed = baseQuery.trim();

  if (!trimmed) {
    return [];
  }

  // Generate variants with different qualifiers
  const variants = [
    trimmed,                                    // Original query
    `${trimmed} company website`,               // Add "company website"
    `${trimmed} business`,                      // Add "business"
    `${trimmed} official site`,                 // Add "official site"
    `${trimmed} contact`,                       // Add "contact" (helps find company pages)
  ];

  // Check if query has location, add UK qualifier if not obvious
  const hasUKIndicator = /\b(uk|united kingdom|britain|england|scotland|wales)\b/i.test(trimmed);
  if (!hasUKIndicator && /\b(in|near|around)\b/i.test(trimmed)) {
    variants.push(`${trimmed} UK`);
  }

  // Deduplicate while preserving order
  const unique = Array.from(new Set(variants));

  return unique;
}

/**
 * Parse a lead search query to extract structured components
 * Useful for more targeted search generation
 * 
 * @param query - Raw search query
 * @returns Parsed components
 * 
 * TODO: Use NLP to better extract niche, location, and qualifiers
 */
export function parseSearchQuery(query: string): {
  niche?: string;
  location?: string;
  qualifiers: string[];
} {
  const normalized = query.toLowerCase().trim();

  // Simple heuristic parsing
  // Look for location indicators
  const locationMatch = normalized.match(/\b(?:in|near|around)\s+([a-z\s]+)$/i);
  const location = locationMatch?.[1]?.trim();

  // Everything before location is likely the niche
  const niche = location
    ? normalized.replace(new RegExp(`\\b(?:in|near|around)\\s+${location}$`, "i"), "").trim()
    : normalized;

  // Extract qualifiers (words that modify the search)
  const qualifiers: string[] = [];
  const qualifierPatterns = ["best", "top", "cheap", "affordable", "premium", "local"];
  
  qualifierPatterns.forEach(pattern => {
    if (normalized.includes(pattern)) {
      qualifiers.push(pattern);
    }
  });

  const result: {
    niche?: string;
    location?: string;
    qualifiers: string[];
  } = {
    qualifiers,
  };

  if (niche) result.niche = niche;
  if (location) result.location = location;

  return result;
}
