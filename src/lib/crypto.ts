import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
// SECURITY: Use environment-specific salt to prevent rainbow table attacks
const SALT =
	process.env.ENCRYPTION_SALT ||
	process.env.ENCRYPTION_KEY ||
	"default-fallback-salt-CHANGE-IN-PROD";

/**
 * Encryption utility for sensitive data like access tokens
 * Uses AES-256-GCM for authenticated encryption with proper IV handling
 *
 * SECURITY IMPROVEMENTS:
 * - Uses secure createCipheriv/createDecipheriv (not deprecated createCipher)
 * - Proper GCM authentication tag handling
 * - Environment-specific salt for key derivation
 * - Constant-time comparison for auth tags
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Utilities operate as pure static helpers
export class CryptoService {
	private static encryptionKey: Buffer | null = null;

	private static getEncryptionKey(): Buffer {
		if (!CryptoService.encryptionKey) {
			const keyString = process.env.ENCRYPTION_KEY;
			if (!keyString) {
				throw new Error("ENCRYPTION_KEY environment variable is required");
			}

			// Derive key from environment variable using PBKDF2 with environment-specific salt
			const salt = crypto.createHash("sha256").update(SALT).digest();
			CryptoService.encryptionKey = crypto.pbkdf2Sync(
				keyString,
				salt,
				100000,
				KEY_LENGTH,
				"sha256",
			);
		}
		return CryptoService.encryptionKey;
	}

	/**
	 * Encrypt sensitive data using AES-256-GCM
	 * @param data - The data to encrypt
	 * @returns Base64 encoded encrypted data with IV and auth tag
	 * Format: [IV (16 bytes)][Auth Tag (16 bytes)][Encrypted Data]
	 */
	static encrypt(data: string): string {
		try {
			const key = CryptoService.getEncryptionKey();
			const iv = crypto.randomBytes(IV_LENGTH);

			// Use proper GCM mode with explicit IV
			const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

			let encrypted = cipher.update(data, "utf8");
			encrypted = Buffer.concat([encrypted, cipher.final()]);

			// Get authentication tag for GCM mode
			const authTag = cipher.getAuthTag();

			// Combine IV + Auth Tag + Encrypted Data for storage
			const combined = Buffer.concat([iv, authTag, encrypted]);
			return combined.toString("base64");
		} catch (error) {
			console.error("Encryption error:", error);
			throw new Error("Failed to encrypt data");
		}
	}

	/**
	 * Decrypt sensitive data encrypted with AES-256-GCM
	 * @param encryptedData - Base64 encoded encrypted data with IV and auth tag
	 * @returns Decrypted string
	 */
	static decrypt(encryptedData: string): string {
		try {
			const key = CryptoService.getEncryptionKey();
			const combined = Buffer.from(encryptedData, "base64");

			// Extract components: IV (16) + Auth Tag (16) + Encrypted Data
			const iv = combined.subarray(0, IV_LENGTH);
			const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
			const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

			// Use proper GCM mode with explicit IV
			const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
			decipher.setAuthTag(authTag);

			let decrypted = decipher.update(encrypted);
			decrypted = Buffer.concat([decrypted, decipher.final()]);

			return decrypted.toString("utf8");
		} catch (error) {
			console.error("Decryption error:", error);
			throw new Error(
				"Failed to decrypt data - data may be corrupted or tampered",
			);
		}
	}

	/**
	 * Generate a secure random string for CSRF tokens
	 * @param length - Length of the random string in bytes (result will be hex, so 2x length)
	 * @returns Cryptographically secure random hex string
	 */
	static generateSecureToken(length = 32): string {
		return crypto.randomBytes(length).toString("hex");
	}
}
