"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.generateEncryptionKey = generateEncryptionKey;
const crypto_1 = __importDefault(require("crypto"));
// Get encryption key from environment (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    console.warn("EMAIL_ENCRYPTION_KEY not set. Email credentials will not be encrypted properly.");
}
// Convert key to buffer (handle both hex and string formats)
function getKeyBuffer() {
    if (!ENCRYPTION_KEY) {
        // Fallback key for development (NOT FOR PRODUCTION)
        return Buffer.from("dev-key-not-secure-change-me!".padEnd(32, "0"));
    }
    // If key is hex format (64 chars), parse as hex
    if (ENCRYPTION_KEY.length === 64) {
        return Buffer.from(ENCRYPTION_KEY, "hex");
    }
    // Otherwise pad/truncate to 32 bytes
    return Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").substring(0, 32));
}
/**
 * Encrypt a string using AES-256-CBC
 * Returns format: iv:encryptedData (both hex-encoded)
 */
function encrypt(text) {
    if (!text)
        return "";
    const key = getKeyBuffer();
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    // Return IV and encrypted data separated by colon
    return iv.toString("hex") + ":" + encrypted;
}
/**
 * Decrypt a string that was encrypted with encrypt()
 * Expects format: iv:encryptedData
 */
function decrypt(text) {
    if (!text)
        return "";
    const key = getKeyBuffer();
    const parts = text.split(":");
    if (parts.length !== 2) {
        throw new Error("Invalid encrypted data format");
    }
    if (!parts[0] || !parts[1]) {
        throw new Error("Invalid encrypted data format");
    }
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
}
/**
 * Generate a secure random encryption key (32 bytes for AES-256)
 * Use this once to generate a key and store in environment variables
 */
function generateEncryptionKey() {
    return crypto_1.default.randomBytes(32).toString("hex");
}
//# sourceMappingURL=encryption.js.map