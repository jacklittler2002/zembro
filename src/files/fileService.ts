import { prisma } from "../db";

export interface CreateFileUploadInput {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  bucket?: string;
  isPublic?: boolean;
}

/**
 * Create a file upload record
 */
export async function createFileUpload(userId: string, input: CreateFileUploadInput) {
  return prisma.fileUpload.create({
    data: {
      userId,
      filename: input.filename,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      url: input.url,
      bucket: input.bucket || "uploads",
      isPublic: input.isPublic || false,
    },
  });
}

/**
 * Get user's file uploads
 */
export async function getUserFileUploads(userId: string, limit = 50, offset = 0) {
  return prisma.fileUpload.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get file upload by ID
 */
export async function getFileUploadById(fileId: string, userId: string) {
  return prisma.fileUpload.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });
}

/**
 * Delete file upload
 */
export async function deleteFileUpload(fileId: string, userId: string) {
  return prisma.fileUpload.deleteMany({
    where: {
      id: fileId,
      userId,
    },
  });
}

/**
 * Get public files
 */
export async function getPublicFiles(limit = 100) {
  return prisma.fileUpload.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Update file metadata
 */
export async function updateFileUpload(
  fileId: string,
  userId: string,
  updates: Partial<Pick<CreateFileUploadInput, "originalName" | "isPublic">>
) {
  return prisma.fileUpload.updateMany({
    where: {
      id: fileId,
      userId,
    },
    data: updates,
  });
}