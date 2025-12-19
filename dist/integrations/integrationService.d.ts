export interface CreateIntegrationInput {
    type: string;
    name: string;
    config: any;
}
/**
 * Create a new integration for a user
 */
export declare function createIntegration(userId: string, input: CreateIntegrationInput): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    isActive: boolean;
    type: import(".prisma/client").$Enums.IntegrationType;
    config: import("@prisma/client/runtime/client").JsonValue;
    lastSyncAt: Date | null;
}>;
/**
 * Get all integrations for a user
 */
export declare function getUserIntegrations(userId: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    isActive: boolean;
    type: import(".prisma/client").$Enums.IntegrationType;
    config: import("@prisma/client/runtime/client").JsonValue;
    lastSyncAt: Date | null;
}[]>;
/**
 * Get integration by ID
 */
export declare function getIntegrationById(integrationId: string, userId: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    isActive: boolean;
    type: import(".prisma/client").$Enums.IntegrationType;
    config: import("@prisma/client/runtime/client").JsonValue;
    lastSyncAt: Date | null;
} | null>;
/**
 * Update integration
 */
export declare function updateIntegration(integrationId: string, userId: string, updates: Partial<CreateIntegrationInput & {
    isActive: boolean;
}>): Promise<import(".prisma/client").Prisma.BatchPayload>;
/**
 * Delete integration
 */
export declare function deleteIntegration(integrationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
/**
 * Update last sync time
 */
export declare function updateIntegrationLastSync(integrationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
/**
 * Get active integrations by type
 */
export declare function getActiveIntegrationsByType(userId: string, type: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    isActive: boolean;
    type: import(".prisma/client").$Enums.IntegrationType;
    config: import("@prisma/client/runtime/client").JsonValue;
    lastSyncAt: Date | null;
}[]>;
//# sourceMappingURL=integrationService.d.ts.map