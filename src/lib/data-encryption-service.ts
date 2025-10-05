/**
 * Data Encryption Service
 * Provides field-level encryption for sensitive financial data
 * Uses AES-256-GCM encryption for merchant names, descriptions, and account numbers
 *
 * Security Features:
 * - Field-level encryption for PII and sensitive transaction data
 * - Batch encryption/decryption for performance
 * - Null/undefined handling for optional fields
 * - Type-safe encryption/decryption interfaces
 */

import { CryptoService } from "./crypto";

/**
 * Fields that require encryption in transaction data
 */
export interface EncryptedTransactionFields {
	merchant_name?: string;
	description?: string;
}

/**
 * Fields that require encryption in account data
 */
export interface EncryptedAccountFields {
	account_number?: string;
	sort_code?: string;
	iban?: string;
}

/**
 * Generic encrypted field container
 */
export interface EncryptedData<T> {
	encrypted: boolean;
	data: T;
}

export class DataEncryptionService {
	/**
	 * Encrypt sensitive transaction fields
	 * @param transaction - Transaction data with sensitive fields
	 * @returns Transaction data with encrypted sensitive fields
	 */
	static encryptTransactionFields<T extends EncryptedTransactionFields>(
		transaction: T,
	): T {
		const encrypted = { ...transaction };

		// Encrypt merchant name if present
		if (
			encrypted.merchant_name &&
			typeof encrypted.merchant_name === "string"
		) {
			encrypted.merchant_name = CryptoService.encrypt(
				encrypted.merchant_name,
			);
		}

		// Encrypt description if present
		if (encrypted.description && typeof encrypted.description === "string") {
			encrypted.description = CryptoService.encrypt(encrypted.description);
		}

		return encrypted;
	}

	/**
	 * Decrypt sensitive transaction fields
	 * @param transaction - Transaction data with encrypted sensitive fields
	 * @returns Transaction data with decrypted sensitive fields
	 */
	static decryptTransactionFields<T extends EncryptedTransactionFields>(
		transaction: T,
	): T {
		const decrypted = { ...transaction };

		// Decrypt merchant name if present
		if (
			decrypted.merchant_name &&
			typeof decrypted.merchant_name === "string"
		) {
			try {
				decrypted.merchant_name = CryptoService.decrypt(
					decrypted.merchant_name,
				);
			} catch (error) {
				console.error("Failed to decrypt merchant_name:", error);
				decrypted.merchant_name = "[Encrypted]";
			}
		}

		// Decrypt description if present
		if (decrypted.description && typeof decrypted.description === "string") {
			try {
				decrypted.description = CryptoService.decrypt(decrypted.description);
			} catch (error) {
				console.error("Failed to decrypt description:", error);
				decrypted.description = "[Encrypted]";
			}
		}

		return decrypted;
	}

	/**
	 * Encrypt sensitive account fields
	 * @param account - Account data with sensitive fields
	 * @returns Account data with encrypted sensitive fields
	 */
	static encryptAccountFields<T extends EncryptedAccountFields>(account: T): T {
		const encrypted = { ...account };

		// Encrypt account number if present
		if (
			encrypted.account_number &&
			typeof encrypted.account_number === "string"
		) {
			encrypted.account_number = CryptoService.encrypt(
				encrypted.account_number,
			);
		}

		// Encrypt sort code if present
		if (encrypted.sort_code && typeof encrypted.sort_code === "string") {
			encrypted.sort_code = CryptoService.encrypt(encrypted.sort_code);
		}

		// Encrypt IBAN if present
		if (encrypted.iban && typeof encrypted.iban === "string") {
			encrypted.iban = CryptoService.encrypt(encrypted.iban);
		}

		return encrypted;
	}

	/**
	 * Decrypt sensitive account fields
	 * @param account - Account data with encrypted sensitive fields
	 * @returns Account data with decrypted sensitive fields
	 */
	static decryptAccountFields<T extends EncryptedAccountFields>(account: T): T {
		const decrypted = { ...account };

		// Decrypt account number if present
		if (
			decrypted.account_number &&
			typeof decrypted.account_number === "string"
		) {
			try {
				decrypted.account_number = CryptoService.decrypt(
					decrypted.account_number,
				);
			} catch (error) {
				console.error("Failed to decrypt account_number:", error);
				decrypted.account_number = "****";
			}
		}

		// Decrypt sort code if present
		if (decrypted.sort_code && typeof decrypted.sort_code === "string") {
			try {
				decrypted.sort_code = CryptoService.decrypt(decrypted.sort_code);
			} catch (error) {
				console.error("Failed to decrypt sort_code:", error);
				decrypted.sort_code = "**-**-**";
			}
		}

		// Decrypt IBAN if present
		if (decrypted.iban && typeof decrypted.iban === "string") {
			try {
				decrypted.iban = CryptoService.decrypt(decrypted.iban);
			} catch (error) {
				console.error("Failed to decrypt iban:", error);
				decrypted.iban = "****";
			}
		}

		return decrypted;
	}

	/**
	 * Batch encrypt transaction fields for performance
	 * @param transactions - Array of transactions to encrypt
	 * @returns Array of transactions with encrypted sensitive fields
	 */
	static encryptTransactionBatch<T extends EncryptedTransactionFields>(
		transactions: T[],
	): T[] {
		return transactions.map((transaction) =>
			this.encryptTransactionFields(transaction),
		);
	}

	/**
	 * Batch decrypt transaction fields for performance
	 * @param transactions - Array of transactions to decrypt
	 * @returns Array of transactions with decrypted sensitive fields
	 */
	static decryptTransactionBatch<T extends EncryptedTransactionFields>(
		transactions: T[],
	): T[] {
		return transactions.map((transaction) =>
			this.decryptTransactionFields(transaction),
		);
	}

	/**
	 * Check if a field appears to be encrypted (base64 with proper length)
	 * @param field - Field to check
	 * @returns True if field appears encrypted
	 */
	static isEncrypted(field: string | null | undefined): boolean {
		if (!field) return false;

		// Check if it's base64 and has minimum length for IV + Tag + Data
		const base64Regex = /^[A-Za-z0-9+/]+=*$/;
		const minEncryptedLength = 44; // Base64 of 32 bytes (IV + Tag)

		return (
			base64Regex.test(field) &&
			field.length >= minEncryptedLength &&
			field.length % 4 === 0
		);
	}

	/**
	 * Safely encrypt a string field (handles null/undefined)
	 * @param value - String value to encrypt
	 * @returns Encrypted string or original null/undefined
	 */
	static encryptString(value: string | null | undefined): string | null {
		if (!value) return null;
		return CryptoService.encrypt(value);
	}

	/**
	 * Safely decrypt a string field (handles null/undefined)
	 * @param value - Encrypted string value
	 * @returns Decrypted string or null
	 */
	static decryptString(value: string | null | undefined): string | null {
		if (!value) return null;
		try {
			return CryptoService.decrypt(value);
		} catch (error) {
			console.error("Failed to decrypt string field:", error);
			return "[Encrypted]";
		}
	}
}
