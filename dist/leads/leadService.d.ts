import { CompanySize } from "@prisma/client";
export interface LeadFilters {
    userId: string;
    industry?: string;
    sizeBucket?: CompanySize;
    country?: string;
    minScore?: number;
    isFavorited?: boolean;
    isArchived?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
}
export interface UpdateLeadInput {
    companyId: string;
    userId: string;
    isFavorited?: boolean;
    isArchived?: boolean;
    notes?: string;
}
/**
 * Get all leads (companies with contacts) for a user with filtering and pagination
 */
export declare function getLeads(filters: LeadFilters): Promise<{
    leads: ({
        contacts: {
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            leadKey: string | null;
            source: string;
            linkedinUrl: string | null;
            firstName: string | null;
            lastName: string | null;
            role: string | null;
            isLikelyDecisionMaker: boolean;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        niche: string | null;
        domain: string | null;
        websiteUrl: string | null;
        country: string | null;
        city: string | null;
        street: string | null;
        postalCode: string | null;
        phone: string | null;
        source: string;
        category: string | null;
        tags: string[];
        aiConfidence: number | null;
        lastSeenAt: Date | null;
        lastCrawledAt: Date | null;
        rawContent: string | null;
        addressRaw: string | null;
        businessType: string | null;
        facebookUrl: string | null;
        hqCity: string | null;
        hqCountry: string | null;
        idealCustomerNotes: string | null;
        industry: string | null;
        instagramUrl: string | null;
        keywords: string[];
        linkedinUrl: string | null;
        sizeBucket: import(".prisma/client").$Enums.CompanySize | null;
        twitterUrl: string | null;
        isArchived: boolean;
        isFavorited: boolean;
        notes: string | null;
    })[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
}>;
/**
 * Get a single lead (company) with all details
 */
export declare function getLeadById(companyId: string, userId: string): Promise<{
    leadSearches: {
        query: string;
        id: string;
        createdAt: Date;
    }[];
    contacts: {
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        leadKey: string | null;
        source: string;
        linkedinUrl: string | null;
        firstName: string | null;
        lastName: string | null;
        role: string | null;
        isLikelyDecisionMaker: boolean;
    }[];
    listLeads: ({
        list: {
            name: string;
            id: string;
            color: string | null;
        };
    } & {
        id: string;
        companyId: string;
        contactId: string | null;
        listId: string;
        notes: string | null;
        addedBy: string;
        addedAt: Date;
    })[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    niche: string | null;
    domain: string | null;
    websiteUrl: string | null;
    country: string | null;
    city: string | null;
    street: string | null;
    postalCode: string | null;
    phone: string | null;
    source: string;
    category: string | null;
    tags: string[];
    aiConfidence: number | null;
    lastSeenAt: Date | null;
    lastCrawledAt: Date | null;
    rawContent: string | null;
    addressRaw: string | null;
    businessType: string | null;
    facebookUrl: string | null;
    hqCity: string | null;
    hqCountry: string | null;
    idealCustomerNotes: string | null;
    industry: string | null;
    instagramUrl: string | null;
    keywords: string[];
    linkedinUrl: string | null;
    sizeBucket: import(".prisma/client").$Enums.CompanySize | null;
    twitterUrl: string | null;
    isArchived: boolean;
    isFavorited: boolean;
    notes: string | null;
}>;
/**
 * Update lead status (favorite, archive, notes)
 */
export declare function updateLead(input: UpdateLeadInput): Promise<{
    contacts: {
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        leadKey: string | null;
        source: string;
        linkedinUrl: string | null;
        firstName: string | null;
        lastName: string | null;
        role: string | null;
        isLikelyDecisionMaker: boolean;
    }[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    niche: string | null;
    domain: string | null;
    websiteUrl: string | null;
    country: string | null;
    city: string | null;
    street: string | null;
    postalCode: string | null;
    phone: string | null;
    source: string;
    category: string | null;
    tags: string[];
    aiConfidence: number | null;
    lastSeenAt: Date | null;
    lastCrawledAt: Date | null;
    rawContent: string | null;
    addressRaw: string | null;
    businessType: string | null;
    facebookUrl: string | null;
    hqCity: string | null;
    hqCountry: string | null;
    idealCustomerNotes: string | null;
    industry: string | null;
    instagramUrl: string | null;
    keywords: string[];
    linkedinUrl: string | null;
    sizeBucket: import(".prisma/client").$Enums.CompanySize | null;
    twitterUrl: string | null;
    isArchived: boolean;
    isFavorited: boolean;
    notes: string | null;
}>;
/**
 * Get unique industries from user's leads for filter dropdown
 */
export declare function getLeadIndustries(userId: string): Promise<(string | null)[]>;
/**
 * Get unique countries from user's leads for filter dropdown
 */
export declare function getLeadCountries(userId: string): Promise<(string | null)[]>;
/**
 * Get lead statistics for a user
 */
export declare function getLeadStats(userId: string): Promise<{
    totalLeads: number;
    favoritedLeads: number;
    archivedLeads: number;
    companiesWithContacts: number;
    avgScore: number | null;
}>;
//# sourceMappingURL=leadService.d.ts.map