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
        rawContent: string | null;
        linkedinUrl: string | null;
        facebookUrl: string | null;
        twitterUrl: string | null;
        instagramUrl: string | null;
        addressRaw: string | null;
        industry: string | null;
        sizeBucket: import(".prisma/client").$Enums.CompanySize | null;
        hqCity: string | null;
        hqCountry: string | null;
        businessType: string | null;
        keywords: string[];
        idealCustomerNotes: string | null;
        isFavorited: boolean;
        isArchived: boolean;
        notes: string | null;
        lastSeenAt: Date | null;
        lastCrawledAt: Date | null;
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
    contacts: {
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
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
    rawContent: string | null;
    linkedinUrl: string | null;
    facebookUrl: string | null;
    twitterUrl: string | null;
    instagramUrl: string | null;
    addressRaw: string | null;
    industry: string | null;
    sizeBucket: import(".prisma/client").$Enums.CompanySize | null;
    hqCity: string | null;
    hqCountry: string | null;
    businessType: string | null;
    keywords: string[];
    idealCustomerNotes: string | null;
    isFavorited: boolean;
    isArchived: boolean;
    notes: string | null;
    lastSeenAt: Date | null;
    lastCrawledAt: Date | null;
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
    rawContent: string | null;
    linkedinUrl: string | null;
    facebookUrl: string | null;
    twitterUrl: string | null;
    instagramUrl: string | null;
    addressRaw: string | null;
    industry: string | null;
    sizeBucket: import(".prisma/client").$Enums.CompanySize | null;
    hqCity: string | null;
    hqCountry: string | null;
    businessType: string | null;
    keywords: string[];
    idealCustomerNotes: string | null;
    isFavorited: boolean;
    isArchived: boolean;
    notes: string | null;
    lastSeenAt: Date | null;
    lastCrawledAt: Date | null;
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