"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIntegration = createIntegration;
exports.getUserIntegrations = getUserIntegrations;
exports.getIntegrationById = getIntegrationById;
exports.updateIntegration = updateIntegration;
exports.deleteIntegration = deleteIntegration;
exports.updateIntegrationLastSync = updateIntegrationLastSync;
exports.getActiveIntegrationsByType = getActiveIntegrationsByType;
const db_1 = require("../db");
/**
 * Create a new integration for a user
 */
async function createIntegration(userId, input) {
    return db_1.prisma.integration.create({
        data: {
            userId,
            type: input.type,
            name: input.name,
            config: input.config,
        },
    });
}
/**
 * Get all integrations for a user
 */
async function getUserIntegrations(userId) {
    return db_1.prisma.integration.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
}
/**
 * Get integration by ID
 */
async function getIntegrationById(integrationId, userId) {
    return db_1.prisma.integration.findFirst({
        where: {
            id: integrationId,
            userId,
        },
    });
}
/**
 * Update integration
 */
async function updateIntegration(integrationId, userId, updates) {
    return db_1.prisma.integration.updateMany({
        where: {
            id: integrationId,
            userId,
        },
        data: {
            ...updates,
            ...(updates.type && { type: updates.type }),
        },
    });
}
/**
 * Delete integration
 */
async function deleteIntegration(integrationId, userId) {
    return db_1.prisma.integration.deleteMany({
        where: {
            id: integrationId,
            userId,
        },
    });
}
/**
 * Update last sync time
 */
async function updateIntegrationLastSync(integrationId, userId) {
    return db_1.prisma.integration.updateMany({
        where: {
            id: integrationId,
            userId,
        },
        data: { lastSyncAt: new Date() },
    });
}
/**
 * Get active integrations by type
 */
async function getActiveIntegrationsByType(userId, type) {
    return db_1.prisma.integration.findMany({
        where: {
            userId,
            type: type,
            isActive: true,
        },
    });
}
//# sourceMappingURL=integrationService.js.map