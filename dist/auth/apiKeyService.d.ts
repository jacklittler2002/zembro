export interface CreateApiKeyInput {
    name: string;
    permissions?: string[];
    expiresAt?: Date;
}
/**
 * Create a new API key for a user
 */
export declare function createApiKey(userId: string, input: CreateApiKeyInput): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    key: string;
    permissions: import("@prisma/client/runtime/client").JsonValue;
    isActive: boolean;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
}>;
/**
 * Get all API keys for a user
 */
export declare function getUserApiKeys(userId: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    permissions: import("@prisma/client/runtime/client").JsonValue;
    isActive: boolean;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
}[]>;
/**
 * Get API key by key value (for authentication)
 */
export declare function getApiKeyByKey(key: string): Promise<({
    user: {
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    };
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    key: string;
    permissions: import("@prisma/client/runtime/client").JsonValue;
    isActive: boolean;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
}) | null>;
/**
 * Update API key last used time
 */
export declare function updateApiKeyLastUsed(keyId: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    key: string;
    permissions: import("@prisma/client/runtime/client").JsonValue;
    isActive: boolean;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
}>;
/**
 * Revoke an API key
 */
export declare function revokeApiKey(userId: string, keyId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
/**
 * Delete an API key
 */
export declare function deleteApiKey(userId: string, keyId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
/**
 * Validate API key permissions
 */
export declare function hasPermission(apiKey: any, requiredPermission: string): boolean;
//# sourceMappingURL=apiKeyService.d.ts.map