/**
 * PHI Encryption Service
 * 
 * Provides field-level AES-256-GCM encryption for Protected Health Information (PHI)
 * and Personally Identifiable Information (PII) in compliance with HIPAA and SOC 2 requirements.
 * 
 * Features:
 * - Field-level encryption for sensitive data
 * - Key versioning for rotation support
 * - Transparent encrypt/decrypt operations
 * - Audit logging integration
 */

import { encryptToString, decryptFromString, type EncryptedData } from '../utils/encryption';

// ============================================
// Configuration
// ============================================

/**
 * PHI field categories for classification
 */
export type PHIFieldCategory = 
  | 'medical'      // Medical conditions, diagnoses, treatments
  | 'demographic'  // DOB, SSN, address
  | 'contact'      // Email, phone (when combined with health info)
  | 'financial'    // Payment info, insurance
  | 'identifier';  // Member IDs, account numbers

/**
 * Configuration for a PHI field that requires encryption
 */
export interface PHIFieldConfig {
  /** Field name in the database/object */
  fieldName: string;
  /** Category for audit purposes */
  category: PHIFieldCategory;
  /** Whether this field is required to be encrypted */
  required: boolean;
  /** Human-readable description */
  description: string;
}

/**
 * Default PHI fields that require encryption
 * Based on HIPAA Safe Harbor de-identification standard (18 identifiers)
 */
export const PHI_FIELDS: PHIFieldConfig[] = [
  // Medical Information
  { fieldName: 'medical_conditions', category: 'medical', required: true, description: 'Medical conditions and diagnoses' },
  { fieldName: 'allergies', category: 'medical', required: true, description: 'Known allergies' },
  { fieldName: 'medications', category: 'medical', required: true, description: 'Current medications' },
  { fieldName: 'treatment_notes', category: 'medical', required: true, description: 'Treatment notes and history' },
  
  // Demographic Identifiers
  { fieldName: 'date_of_birth', category: 'demographic', required: true, description: 'Date of birth' },
  { fieldName: 'ssn', category: 'demographic', required: true, description: 'Social Security Number' },
  { fieldName: 'drivers_license', category: 'demographic', required: false, description: 'Driver\'s license number' },
  
  // Contact Information (PHI when combined with health data)
  { fieldName: 'email', category: 'contact', required: false, description: 'Email address' },
  { fieldName: 'phone', category: 'contact', required: false, description: 'Phone number' },
  { fieldName: 'address', category: 'contact', required: false, description: 'Street address' },
  
  // Financial/Insurance
  { fieldName: 'insurance_id', category: 'financial', required: true, description: 'Insurance member ID' },
  { fieldName: 'insurance_group', category: 'financial', required: false, description: 'Insurance group number' },
  
  // Unique Identifiers
  { fieldName: 'membership_number', category: 'identifier', required: false, description: 'Membership/Account number' },
  { fieldName: 'medical_record_number', category: 'identifier', required: true, description: 'Medical record number' },
];

/**
 * Get the list of field names that require encryption
 */
export function getEncryptedFieldNames(): string[] {
  return PHI_FIELDS.filter(f => f.required).map(f => f.fieldName);
}

/**
 * Check if a field should be encrypted
 */
export function isEncryptedField(fieldName: string): boolean {
  return PHI_FIELDS.some(f => f.fieldName === fieldName);
}

/**
 * Get field configuration
 */
export function getFieldConfig(fieldName: string): PHIFieldConfig | undefined {
  return PHI_FIELDS.find(f => f.fieldName === fieldName);
}

// ============================================
// Key Management
// ============================================

/**
 * Encrypted value with metadata
 */
export interface EncryptedPHIValue {
  /** Encrypted payload (base64) */
  payload: string;
  /** Key version used for encryption */
  keyVersion: number;
  /** Encryption timestamp */
  encryptedAt: string;
  /** Field category for audit */
  category: PHIFieldCategory;
}

/**
 * Get the current encryption key from environment
 */
function getEncryptionKey(): string {
  const key = import.meta.env.VITE_PHI_ENCRYPTION_KEY || import.meta.env.VITE_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'PHI encryption key not configured. Set VITE_PHI_ENCRYPTION_KEY or VITE_ENCRYPTION_KEY environment variable.'
    );
  }
  
  if (typeof key !== 'string' || key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error('PHI encryption key must be exactly 64 hexadecimal characters (256 bits).');
  }
  
  return key;
}

/**
 * Get the current key version
 */
function getKeyVersion(): number {
  const version = import.meta.env.VITE_ENCRYPTION_KEY_VERSION;
  return version ? parseInt(version, 10) : 1;
}

// ============================================
// Encryption Operations
// ============================================

/**
 * Encrypt a single PHI field value
 * 
 * @param value - Plain text value to encrypt
 * @param fieldName - Name of the field (for metadata)
 * @returns Encrypted value with metadata as JSON string
 */
export async function encryptPHIField(
  value: string | null | undefined,
  fieldName: string
): Promise<string | null> {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const config = getFieldConfig(fieldName);
  const key = getEncryptionKey();
  const keyVersion = getKeyVersion();
  
  try {
    const payload = await encryptToString(value, key);
    
    const encryptedValue: EncryptedPHIValue = {
      payload,
      keyVersion,
      encryptedAt: new Date().toISOString(),
      category: config?.category || 'identifier',
    };
    
    return JSON.stringify(encryptedValue);
  } catch (error) {
    console.error(`[PHI Encryption] Failed to encrypt field '${fieldName}':`, error);
    throw new Error(`Failed to encrypt PHI field '${fieldName}'`);
  }
}

/**
 * Decrypt a single PHI field value
 * 
 * @param encryptedJson - JSON string containing EncryptedPHIValue
 * @param fieldName - Name of the field (for logging)
 * @returns Decrypted plain text value
 */
export async function decryptPHIField(
  encryptedJson: string | null | undefined,
  fieldName: string
): Promise<string | null> {
  if (encryptedJson === null || encryptedJson === undefined || encryptedJson === '') {
    return null;
  }

  try {
    // Check if this is already unencrypted (backward compatibility)
    if (!encryptedJson.startsWith('{')) {
      // Value is not encrypted, return as-is
      console.warn(`[PHI Encryption] Field '${fieldName}' is not encrypted. Consider migrating.`);
      return encryptedJson;
    }
    
    const encryptedValue: EncryptedPHIValue = JSON.parse(encryptedJson);
    const key = getEncryptionKey();
    const currentKeyVersion = getKeyVersion();
    
    // Check key version compatibility
    if (encryptedValue.keyVersion !== currentKeyVersion) {
      console.warn(
        `[PHI Encryption] Field '${fieldName}' encrypted with key version ${encryptedValue.keyVersion}, ` +
        `current version is ${currentKeyVersion}. Re-encryption may be needed.`
      );
    }
    
    return await decryptFromString(encryptedValue.payload, key);
  } catch (error) {
    console.error(`[PHI Encryption] Failed to decrypt field '${fieldName}':`, error);
    throw new Error(`Failed to decrypt PHI field '${fieldName}'`);
  }
}

// ============================================
// Batch Operations
// ============================================

/**
 * Encrypt multiple PHI fields in an object
 * Only encrypts fields defined in PHI_FIELDS
 * 
 * @param data - Object containing fields to encrypt
 * @param fieldsToEncrypt - Optional list of specific fields to encrypt (defaults to all PHI fields)
 * @returns Object with encrypted PHI fields
 */
export async function encryptPHIFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt?: string[]
): Promise<T> {
  const fieldNames = fieldsToEncrypt || getEncryptedFieldNames();
  const result = { ...data };
  
  for (const fieldName of fieldNames) {
    if (fieldName in data && data[fieldName] !== undefined) {
      const value = data[fieldName];
      
      if (typeof value === 'string') {
        (result as Record<string, unknown>)[fieldName] = await encryptPHIField(value, fieldName);
      } else if (Array.isArray(value)) {
        // Handle array fields (e.g., medical_conditions, allergies, medications)
        const encryptedArray = await Promise.all(
          value.map(async (item, index) => {
            if (typeof item === 'string') {
              return await encryptPHIField(item, `${fieldName}[${index}]`);
            }
            return item;
          })
        );
        (result as Record<string, unknown>)[fieldName] = JSON.stringify({
          type: 'encrypted_array',
          items: encryptedArray,
          keyVersion: getKeyVersion(),
          encryptedAt: new Date().toISOString(),
        });
      }
    }
  }
  
  return result;
}

/**
 * Decrypt multiple PHI fields in an object
 * 
 * @param data - Object containing encrypted fields
 * @param fieldsToDecrypt - Optional list of specific fields to decrypt (defaults to all PHI fields)
 * @returns Object with decrypted PHI fields
 */
export async function decryptPHIFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToDecrypt?: string[]
): Promise<T> {
  const fieldNames = fieldsToDecrypt || getEncryptedFieldNames();
  const result = { ...data };
  
  for (const fieldName of fieldNames) {
    if (fieldName in data && data[fieldName] !== undefined) {
      const value = data[fieldName];
      
      if (typeof value === 'string') {
        // Check if this is an encrypted array
        try {
          const parsed = JSON.parse(value);
          if (parsed.type === 'encrypted_array' && Array.isArray(parsed.items)) {
            const decryptedArray = await Promise.all(
              parsed.items.map(async (item: string | null, index: number) => {
                if (item) {
                  return await decryptPHIField(item, `${fieldName}[${index}]`);
                }
                return item;
              })
            );
            (result as Record<string, unknown>)[fieldName] = decryptedArray;
            continue;
          }
        } catch {
          // Not an encrypted array, treat as regular encrypted field
        }
        
        (result as Record<string, unknown>)[fieldName] = await decryptPHIField(value, fieldName);
      }
    }
  }
  
  return result;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if encryption is properly configured
 */
export function isPHIEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Mask a PHI value for display (show only last 4 characters)
 */
export function maskPHIValue(value: string | null | undefined): string {
  if (!value || value.length < 4) {
    return '****';
  }
  return '*'.repeat(value.length - 4) + value.slice(-4);
}

/**
 * Generate a SHA-256 hash for integrity verification
 */
export async function hashForIntegrity(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify data integrity using stored hash
 */
export async function verifyIntegrity(data: string, expectedHash: string): Promise<boolean> {
  const actualHash = await hashForIntegrity(data);
  return actualHash === expectedHash;
}

// ============================================
// Type Exports
// ============================================

export type { EncryptedData };
