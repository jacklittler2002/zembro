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
export declare function createFileUpload(userId: string, input: CreateFileUploadInput): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    bucket: string;
    isPublic: boolean;
}>;
/**
 * Get user's file uploads
 */
export declare function getUserFileUploads(userId: string, limit?: number, offset?: number): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    bucket: string;
    isPublic: boolean;
}[]>;
/**
 * Get file upload by ID
 */
export declare function getFileUploadById(fileId: string, userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    bucket: string;
    isPublic: boolean;
} | null>;
/**
 * Delete file upload
 */
export declare function deleteFileUpload(fileId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
/**
 * Get public files
 */
export declare function getPublicFiles(limit?: number): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    bucket: string;
    isPublic: boolean;
}[]>;
/**
 * Update file metadata
 */
export declare function updateFileUpload(fileId: string, userId: string, updates: Partial<Pick<CreateFileUploadInput, "originalName" | "isPublic">>): Promise<import(".prisma/client").Prisma.BatchPayload>;
//# sourceMappingURL=fileService.d.ts.map