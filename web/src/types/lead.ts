export interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  isLikelyDecisionMaker: boolean;
}

export interface Lead {
  id: string;
  name: string;
  domain: string | null;
  websiteUrl: string | null;
  industry: string | null;
  sizeBucket: string | null;
  hqCity: string | null;
  hqCountry: string | null;
  aiConfidence: number | null;
  isFavorited: boolean;
  isArchived: boolean;
  notes: string | null;
  createdAt: string;
  contacts: Contact[];
  // Added for compatibility
  // Fields used across lead-search pages
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName: string;
  city?: string | null;
  country?: string | null;
  niche?: string | null;
  role?: string | null;
  score: number | null;
  isDecisionMaker: boolean;
}
