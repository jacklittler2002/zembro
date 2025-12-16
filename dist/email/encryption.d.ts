/**
 * Encrypt a string using AES-256-CBC
 * Returns format: iv:encryptedData (both hex-encoded)
 */
export declare function encrypt(text: string): string;
/**
 * Decrypt a string that was encrypted with encrypt()
 * Expects format: iv:encryptedData
 */
export declare function decrypt(text: string): string;
/**
 * Generate a secure random encryption key (32 bytes for AES-256)
 * Use this once to generate a key and store in environment variables
 */
export declare function generateEncryptionKey(): string;
//# sourceMappingURL=encryption.d.ts.map