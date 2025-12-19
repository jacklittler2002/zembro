import { prisma } from "../db";
import { randomBytes } from "crypto";

export interface CreateApiKeyInput {
  name: string;
  permissions?: string[];
  expiresAt?: Date;
}

/**
 * Generate a secure API key
 */
function generateApiKey(): string {
  return "zk_" + randomBytes(32).toString("hex");
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(userId: string, input: CreateApiKeyInput) {
  const key = generateApiKey();

  return prisma.apiKey.create({
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
export async function getUserApiKeys(userId: string) {
  return prisma.apiKey.findMany({
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
export async function getApiKeyByKey(key: string) {
  return prisma.apiKey.findUnique({
    where: { key },
    include: { user: true },
  });
}

/**
 * Update API key last used time
 */
export async function updateApiKeyLastUsed(keyId: string) {
  return prisma.apiKey.update({
    where: { id: keyId },
    data: { lastUsedAt: new Date() },
  });
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(userId: string, keyId: string) {
  return prisma.apiKey.updateMany({
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
export async function deleteApiKey(userId: string, keyId: string) {
  return prisma.apiKey.deleteMany({
    where: {
      id: keyId,
      userId,
    },
  });
}

/**
 * Validate API key permissions
 */
export function hasPermission(apiKey: any, requiredPermission: string): boolean {
  if (!apiKey.isActive) return false;
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return false;

  const permissions = apiKey.permissions || [];
  return permissions.includes(requiredPermission) || permissions.includes("*");
}