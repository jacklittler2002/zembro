import { normalizeDomain } from "../utils/normalizeDomain";

/**
 * Generate a deterministic lead key for deduplication and charging.
 * Priority order: website/domain > google_maps_place_id > normalized companyName + city + country
 */
export function generateLeadKey(contact: {
  email: string;
  company?: {
    domain?: string | null;
    websiteUrl?: string | null;
    name?: string;
    city?: string | null;
    country?: string | null;
    googleMapsPlaceId?: string | null;
  };
}): string {
  const { company } = contact;

  // Priority 1: Normalized domain from website
  if (company?.domain) {
    return `domain:${normalizeDomain(company.domain)}`;
  }

  if (company?.websiteUrl) {
    const domain = normalizeDomain(company.websiteUrl);
    if (domain) {
      return `domain:${domain}`;
    }
  }

  // Priority 2: Google Maps Place ID (if available)
  if (company?.googleMapsPlaceId) {
    return `place:${company.googleMapsPlaceId}`;
  }

  // Priority 3: Normalized company name + location
  if (company?.name) {
    const normalizedName = company.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_'); // Replace spaces with underscores
    const city = company.city?.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_') || '';
    const country = company.country?.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_') || '';

    const locationKey = city && country ? `${city}_${country}` :
                       city ? city :
                       country ? country : '';

    return `company:${normalizedName}${locationKey ? `_${locationKey}` : ''}`;
  }

  // Fallback: Just use email domain
  const emailDomain = contact.email.split('@')[1]?.toLowerCase();
  return `email:${emailDomain || 'unknown'}`;
}

/**
 * Check if a lead key has already been delivered to a user
 */
export async function hasLeadBeenDelivered(userId: string, leadKey: string): Promise<boolean> {
  const { prisma } = await import("../db");

  const existingTransaction = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      leadKey,
      creditsDelta: -1, // Only count actual charges, not refunds
    },
  });

  return !!existingTransaction;
}