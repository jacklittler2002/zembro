import { prisma } from "../db";

export interface CreateIntegrationInput {
  type: string;
  name: string;
  config: any;
}

/**
 * Create a new integration for a user
 */
export async function createIntegration(userId: string, input: CreateIntegrationInput) {
  return prisma.integration.create({
    data: {
      userId,
      type: input.type as any,
      name: input.name,
      config: input.config,
    },
  });
}

/**
 * Get all integrations for a user
 */
export async function getUserIntegrations(userId: string) {
  return prisma.integration.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get integration by ID
 */
export async function getIntegrationById(integrationId: string, userId: string) {
  return prisma.integration.findFirst({
    where: {
      id: integrationId,
      userId,
    },
  });
}

/**
 * Update integration
 */
export async function updateIntegration(
  integrationId: string,
  userId: string,
  updates: Partial<CreateIntegrationInput & { isActive: boolean }>
) {
  return prisma.integration.updateMany({
    where: {
      id: integrationId,
      userId,
    },
    data: {
      ...updates,
      ...(updates.type && { type: updates.type as any }),
    },
  });
}

/**
 * Delete integration
 */
export async function deleteIntegration(integrationId: string, userId: string) {
  return prisma.integration.deleteMany({
    where: {
      id: integrationId,
      userId,
    },
  });
}

/**
 * Update last sync time
 */
export async function updateIntegrationLastSync(integrationId: string, userId: string) {
  return prisma.integration.updateMany({
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
export async function getActiveIntegrationsByType(userId: string, type: string) {
  return prisma.integration.findMany({
    where: {
      userId,
      type: type as any,
      isActive: true,
    },
  });
}