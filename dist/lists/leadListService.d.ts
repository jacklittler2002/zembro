export declare function createLeadList(userId: string, input: {
    name: string;
    description?: string;
}): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    description: string | null;
}>;
export declare function listLeadLists(userId: string): Promise<({
    _count: {
        items: number;
    };
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    description: string | null;
})[]>;
export declare function getLeadList(userId: string, id: string): Promise<({
    items: ({
        company: {
            name: string;
            id: string;
            domain: string | null;
            industry: string | null;
        };
        contact: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: string | null;
        } | null;
    } & {
        id: string;
        email: string | null;
        createdAt: Date;
        companyId: string;
        contactId: string | null;
        websiteUrl: string | null;
        country: string | null;
        city: string | null;
        industry: string | null;
        sizeBucket: import(".prisma/client").$Enums.CompanySize | null;
        firstName: string | null;
        lastName: string | null;
        role: string | null;
        leadListId: string;
        companyName: string;
        score: number | null;
    })[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    description: string | null;
}) | null>;
export declare function addLeadsFromLeadSearch(userId: string, args: {
    leadListId: string;
    leadSearchId: string;
    limit?: number;
    filters?: {
        minScore?: number;
        industry?: string;
        sizeBucket?: string;
        country?: string;
        decisionMakerOnly?: boolean;
    };
}): Promise<{
    added: number;
    totalCandidates: number;
}>;
export declare function updateLeadList(userId: string, id: string, updates: {
    name?: string;
    description?: string | null;
}): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    description: string | null;
}>;
export declare function deleteLeadList(userId: string, id: string): Promise<{
    success: boolean;
}>;
export declare function removeLeadListItems(userId: string, leadListId: string, itemIds: string[]): Promise<{
    removed: number;
}>;
//# sourceMappingURL=leadListService.d.ts.map