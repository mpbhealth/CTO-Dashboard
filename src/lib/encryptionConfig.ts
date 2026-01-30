/**
 * Encryption Configuration
 * 
 * Validates and exports encryption keys from environment variables.
 * Supports both general encryption and PHI-specific encryption for HIPAA compliance.
 * 
 * Keys must be 64-character hex strings (256 bits) for AES-256-GCM encryption.
 */

// ============================================
// PHI Field Configuration
// ============================================

/**
 * Fields that require encryption for HIPAA/SOC2 compliance
 */
export const ENCRYPTED_PHI_FIELDS = [
  'medical_conditions',
  'allergies',
  'medications',
  'treatment_notes',
  'date_of_birth',
  'ssn',
  'drivers_license',
  'insurance_id',
  'insurance_group',
  'medical_record_number',
] as const;

/**
 * Fields that should be encrypted when combined with health information
 */
export const ENCRYPTED_PII_FIELDS = [
  'email',
  'phone',
  'address',
  'membership_number',
] as const;

/**
 * All encrypted field names
 */
export type EncryptedPHIField = typeof ENCRYPTED_PHI_FIELDS[number];
export type EncryptedPIIField = typeof ENCRYPTED_PII_FIELDS[number];
export type EncryptedField = EncryptedPHIField | EncryptedPIIField;

// ============================================
// Key Validation
// ============================================

/**
 * Check if general encryption is configured
 */
export function isEncryptionConfigured(): boolean {
  const key = import.meta.env.VITE_ENCRYPTION_KEY;
  return typeof key === 'string' && key.length === 64 && /^[0-9a-fA-F]+$/.test(key);
}

/**
 * Check if PHI-specific encryption is configured
 */
export function isPHIEncryptionConfigured(): boolean {
  const key = import.meta.env.VITE_PHI_ENCRYPTION_KEY || import.meta.env.VITE_ENCRYPTION_KEY;
  return typeof key === 'string' && key.length === 64 && /^[0-9a-fA-F]+$/.test(key);
}

/**
 * Get the general encryption key from environment
 * Throws if not properly configured
 */
export function getEncryptionKey(): string {
  const key = import.meta.env.VITE_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'Missing VITE_ENCRYPTION_KEY environment variable. ' +
      'Run `npx ts-node scripts/generate-encryption-key.ts` to generate one.'
    );
  }
  
  if (typeof key !== 'string' || key.length !== 64) {
    throw new Error(
      'VITE_ENCRYPTION_KEY must be exactly 64 hex characters (256 bits). ' +
      `Current length: ${key?.length || 0}`
    );
  }
  
  if (!/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error(
      'VITE_ENCRYPTION_KEY must contain only hexadecimal characters (0-9, a-f, A-F).'
    );
  }
  
  return key;
}

/**
 * Get the PHI encryption key from environment
 * Falls back to general encryption key if PHI-specific key not set
 * Throws if not properly configured
 */
export function getPHIEncryptionKey(): string {
  const key = import.meta.env.VITE_PHI_ENCRYPTION_KEY || import.meta.env.VITE_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'Missing PHI encryption key. Set VITE_PHI_ENCRYPTION_KEY or VITE_ENCRYPTION_KEY environment variable.'
    );
  }
  
  if (typeof key !== 'string' || key.length !== 64) {
    throw new Error(
      'PHI encryption key must be exactly 64 hex characters (256 bits). ' +
      `Current length: ${key?.length || 0}`
    );
  }
  
  if (!/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error(
      'PHI encryption key must contain only hexadecimal characters (0-9, a-f, A-F).'
    );
  }
  
  return key;
}

/**
 * Get the current encryption key version for rotation tracking
 */
export function getEncryptionKeyVersion(): number {
  const version = import.meta.env.VITE_ENCRYPTION_KEY_VERSION;
  return version ? parseInt(version, 10) : 1;
}

/**
 * Lazily initialized encryption key
 * Only throws when actually accessed, allowing the app to load without encryption configured
 */
let _cachedKey: string | null = null;

export const ENCRYPTION_KEY = {
  get value(): string {
    if (_cachedKey === null) {
      _cachedKey = getEncryptionKey();
    }
    return _cachedKey;
  }
};

/**
 * Log encryption configuration status (development only)
 */
export function logEncryptionStatus(): void {
  if (import.meta.env.DEV) {
    const generalConfigured = isEncryptionConfigured();
    const phiConfigured = isPHIEncryptionConfigured();
    const keyVersion = getEncryptionKeyVersion();
    
    console.log('[Encryption] General:', generalConfigured ? '✓ Configured' : '✗ Not configured');
    console.log('[Encryption] PHI:', phiConfigured ? '✓ Configured' : '✗ Not configured');
    console.log('[Encryption] Key Version:', keyVersion);
    
    if (!generalConfigured) {
      console.warn(
        '[Encryption] To enable encryption:\n' +
        '1. Run: npx ts-node scripts/generate-encryption-key.ts\n' +
        '2. Add VITE_ENCRYPTION_KEY=<generated_key> to your .env file'
      );
    }
    
    if (!phiConfigured) {
      console.warn(
        '[Encryption] PHI encryption not configured. For HIPAA compliance:\n' +
        '1. Set VITE_PHI_ENCRYPTION_KEY (or use VITE_ENCRYPTION_KEY)\n' +
        '2. Set VITE_ENCRYPTION_KEY_VERSION for key rotation tracking'
      );
    }
  }
}

/**
 * Check if a field name requires encryption
 */
export function requiresEncryption(fieldName: string): boolean {
  return (ENCRYPTED_PHI_FIELDS as readonly string[]).includes(fieldName) ||
         (ENCRYPTED_PII_FIELDS as readonly string[]).includes(fieldName);
}

