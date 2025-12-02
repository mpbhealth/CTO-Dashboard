/**
 * AES-256 Encryption Key Generator
 * 
 * Generates a cryptographically secure 256-bit key for AES-256-GCM encryption.
 * 
 * Usage:
 *   npx ts-node scripts/generate-encryption-key.ts
 * 
 * Or with Node.js directly:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from 'crypto';

function generateKey(): string {
  // Generate 32 random bytes (256 bits)
  const key = crypto.randomBytes(32);
  // Convert to hex string (64 characters)
  return key.toString('hex');
}

function main(): void {
  const key = generateKey();
  
  console.log('\n🔐 AES-256 Encryption Key Generated\n');
  console.log('━'.repeat(70));
  console.log('\nKey (64 hex characters):\n');
  console.log(`  ${key}\n`);
  console.log('━'.repeat(70));
  console.log('\n📋 Add this to your .env file:\n');
  console.log(`  VITE_ENCRYPTION_KEY=${key}\n`);
  console.log('━'.repeat(70));
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:\n');
  console.log('  • NEVER commit this key to version control');
  console.log('  • Store securely (e.g., password manager, secrets vault)');
  console.log('  • Use different keys for development and production');
  console.log('  • Back up the key - encrypted data is unrecoverable without it');
  console.log('  • Rotate keys periodically and re-encrypt existing data\n');
}

main();

