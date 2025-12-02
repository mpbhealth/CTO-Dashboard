/**
 * Encryption Configuration
 * 
 * Validates and exports the encryption key from environment variables.
 * The key must be a 64-character hex string (256 bits).
 */

/**
 * Check if encryption is configured
 */
export function isEncryptionConfigured(): boolean {
  const key = import.meta.env.VITE_ENCRYPTION_KEY;
  return typeof key === 'string' && key.length === 64 && /^[0-9a-fA-F]+$/.test(key);
}

/**
 * Get the encryption key from environment
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
    const configured = isEncryptionConfigured();
    console.log('[Encryption]', configured ? '✓ Configured' : '✗ Not configured');
    
    if (!configured) {
      console.warn(
        '[Encryption] To enable encryption:\n' +
        '1. Run: npx ts-node scripts/generate-encryption-key.ts\n' +
        '2. Add VITE_ENCRYPTION_KEY=<generated_key> to your .env file'
      );
    }
  }
}

