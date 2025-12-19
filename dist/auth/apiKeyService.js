"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiKey = createApiKey;
exports.getUserApiKeys = getUserApiKeys;
exports.getApiKeyByKey = getApiKeyByKey;
exports.updateApiKeyLastUsed = updateApiKeyLastUsed;
exports.revokeApiKey = revokeApiKey;
exports.deleteApiKey = deleteApiKey;
exports.hasPermission = hasPermission;
const db_1 = require("../db");
const crypto_1 = require("crypto");
/**
 * Generate a secure API key
 */
function generateApiKey() {
    return "zk_" + (0, crypto_1.randomBytes)(32).toString("hex");
}
/**
 * Create a new API key for a user
 */
async function createApiKey(userId, input) {
    const key = generateApiKey();
    return db_1.prisma.apiKey.create({
        data: {
            userId,
            name: input.name,
            key,
            permissions: input.permissions || [],
            ...(input.expiresAt && { expiresAt: input.expiresAt }),
        },
    });
}
/**
 * Get all API keys for a user
 */
async function getUserApiKeys(userId) {
    return db_1.prisma.apiKey.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            permissions: true,
            isActive: true,
            expiresAt: true,
            lastUsedAt: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
}
/**
 * Get API key by key value (for authentication)
 */
async function getApiKeyByKey(key) {
    return db_1.prisma.apiKey.findUnique({
        where: { key },
        include: { user: true },
    });
}
/**
 * Update API key last used time
 */
async function updateApiKeyLastUsed(keyId) {
    return db_1.prisma.apiKey.update({
        where: { id: keyId },
        data: { lastUsedAt: new Date() },
    });
}
/**
 * Revoke an API key
 */
async function revokeApiKey(userId, keyId) {
    return db_1.prisma.apiKey.updateMany({
        where: {
            id: keyId,
            userId,
        },
        data: { isActive: false },
    });
}
/**
 * Delete an API key
 */
async function deleteApiKey(userId, keyId) {
    return db_1.prisma.apiKey.deleteMany({
        where: {
            id: keyId,
            userId,
        },
    });
}
/**
 * Validate API key permissions
 */
function hasPermission(apiKey, requiredPermission) {
    if (!apiKey.isActive)
        return false;
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt)
        return false;
    const permissions = apiKey.permissions || [];
    return permissions.includes(requiredPermission) || permissions.includes("*");
}
//# sourceMappingURL=apiKeyService.js.map