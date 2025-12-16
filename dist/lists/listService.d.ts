export interface CreateListInput {
    userId: string;
    name: string;
    description?: string;
    color?: string;
}
export interface AddLeadsToListInput {
    listId: string;
    userId: string;
    leads: Array<{
        companyId: string;
        contactId?: string;
        notes?: string;
    }>;
}
/**
 * Create a new list
 */
export declare function createList(input: CreateListInput): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    description: string | null;
    color: string | null;
    leadCount: number;
}>;
/**
 * Get list by ID
 */
export declare function getListById(listId: string, userId: string): Promise<{
    leads: ({
        company: {
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
        };
        contact: {
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
        } | null;
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
    userId: string;
    description: string | null;
    color: string | null;
    leadCount: number;
}>;
/**
 * List all lists for a user
 */
export declare function listUserLists(userId: string): Promise<({
    leads: ({
        company: {
            name: string;
            domain: string | null;
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
    userId: string;
    description: string | null;
    color: string | null;
    leadCount: number;
})[]>;
/**
 * Add leads to a list
 */
export declare function addLeadsToList(input: AddLeadsToListInput): Promise<{
    addedCount: number;
    skippedDuplicates: number;
}>;
/**
 * Remove leads from a list
 */
export declare function removeLeadsFromList(listId: string, userId: string, leadIds: string[]): Promise<number>;
/**
 * Update list details
 */
export declare function updateList(listId: string, userId: string, updates: {
    name?: string;
    description?: string;
    color?: string;
}): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    description: string | null;
    color: string | null;
    leadCount: number;
}>;
/**
 * Delete a list
 */
export declare function deleteList(listId: string, userId: string): Promise<void>;
/**
 * Get leads from a list (for campaign import)
 */
export declare function getListLeads(listId: string, userId: string): Promise<{
    companyName: string;
    websiteUrl: string | null;
    domain: string | null;
    country: string | null;
    city: string | null;
    phone: string | null;
    industry: string | null;
    sizeBucket: import(".prisma/client").$Enums.CompanySize | null;
    businessType: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    linkedinUrl: string | null;
    isLikelyDecisionMaker: boolean;
}[]>;
//# sourceMappingURL=listService.d.ts.map