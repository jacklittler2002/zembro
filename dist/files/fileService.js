"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileUpload = createFileUpload;
exports.getUserFileUploads = getUserFileUploads;
exports.getFileUploadById = getFileUploadById;
exports.deleteFileUpload = deleteFileUpload;
exports.getPublicFiles = getPublicFiles;
exports.updateFileUpload = updateFileUpload;
const db_1 = require("../db");
/**
 * Create a file upload record
 */
async function createFileUpload(userId, input) {
    return db_1.prisma.fileUpload.create({
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
async function getUserFileUploads(userId, limit = 50, offset = 0) {
    return db_1.prisma.fileUpload.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
    });
}
/**
 * Get file upload by ID
 */
async function getFileUploadById(fileId, userId) {
    return db_1.prisma.fileUpload.findFirst({
        where: {
            id: fileId,
            userId,
        },
    });
}
/**
 * Delete file upload
 */
async function deleteFileUpload(fileId, userId) {
    return db_1.prisma.fileUpload.deleteMany({
        where: {
            id: fileId,
            userId,
        },
    });
}
/**
 * Get public files
 */
async function getPublicFiles(limit = 100) {
    return db_1.prisma.fileUpload.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}
/**
 * Update file metadata
 */
async function updateFileUpload(fileId, userId, updates) {
    return db_1.prisma.fileUpload.updateMany({
        where: {
            id: fileId,
            userId,
        },
        data: updates,
    });
}
//# sourceMappingURL=fileService.js.map