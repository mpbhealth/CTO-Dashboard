/**
 * Secure Store
 * 
 * High-level wrapper for encrypting and decrypting JSON data.
 * Uses AES-256-GCM encryption via WebCrypto API.
 */

import { encryptToString, decryptFromString } from '@utils/encryption';
import { ENCRYPTION_KEY, isEncryptionConfigured } from './encryptionConfig';

/**
 * Secure storage utilities for encrypted data
 */
export const secureStore = {
  /**
   * Check if encryption is available
   */
  isAvailable(): boolean {
    return isEncryptionConfigured();
  },

  /**
   * Encrypt a value to a storable string
   * 
   * @param value - Any JSON-serializable value
   * @returns Base64-encoded encrypted payload
   * @throws If encryption is not configured
   */
  async set<T>(value: T): Promise<string> {
    const json = JSON.stringify(value);
    return encryptToString(json, ENCRYPTION_KEY.value);
  },

  /**
   * Decrypt a stored payload back to its original value
   * 
   * @param payload - Base64-encoded encrypted payload
   * @returns Decrypted and parsed value
   * @throws If decryption fails or payload is invalid
   */
  async get<T>(payload: string): Promise<T> {
    const json = await decryptFromString(payload, ENCRYPTION_KEY.value);
    return JSON.parse(json) as T;
  },

  /**
   * Encrypt a value, returning null if encryption is not configured
   * Useful for optional encryption scenarios
   * 
   * @param value - Any JSON-serializable value
   * @returns Encrypted payload or null if not configured
   */
  async trySet<T>(value: T): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }
    try {
      return await this.set(value);
    } catch {
      return null;
    }
  },

  /**
   * Decrypt a payload, returning a fallback if decryption fails
   * Useful for graceful degradation
   * 
   * @param payload - Base64-encoded encrypted payload
   * @param fallback - Value to return if decryption fails
   * @returns Decrypted value or fallback
   */
  async tryGet<T>(payload: string, fallback: T): Promise<T> {
    if (!this.isAvailable()) {
      return fallback;
    }
    try {
      return await this.get<T>(payload);
    } catch {
      return fallback;
    }
  },
};

/**
 * Utility type for encrypted field storage
 */
export interface EncryptedField {
  /** Indicates the field is encrypted */
  encrypted: true;
  /** The encrypted payload */
  payload: string;
}

/**
 * Create an encrypted field wrapper
 */
export async function createEncryptedField<T>(value: T): Promise<EncryptedField> {
  const payload = await secureStore.set(value);
  return { encrypted: true, payload };
}

/**
 * Read an encrypted field
 */
export async function readEncryptedField<T>(field: EncryptedField): Promise<T> {
  return secureStore.get<T>(field.payload);
}

/**
 * Check if a value is an encrypted field
 */
export function isEncryptedField(value: unknown): value is EncryptedField {
  return (
    typeof value === 'object' &&
    value !== null &&
    'encrypted' in value &&
    (value as EncryptedField).encrypted === true &&
    'payload' in value &&
    typeof (value as EncryptedField).payload === 'string'
  );
}

