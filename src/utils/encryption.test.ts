/**
 * AES-256-GCM Encryption Tests
 * 
 * Run with: npm run transform:test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  encrypt,
  decrypt,
  encryptToString,
  decryptFromString,
  encryptFile,
  decryptFile,
  generateKey,
  importKey,
  type EncryptedData,
} from './encryption';

// Test key - 64 hex characters (256 bits)
const TEST_KEY = 'a'.repeat(64);

describe('encryption utilities', () => {
  describe('generateKey', () => {
    it('should generate a 64-character hex key', () => {
      const key = generateKey();
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateKey();
      const key2 = generateKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('importKey', () => {
    it('should import a valid hex key', async () => {
      const key = await importKey(TEST_KEY);
      expect(key).toBeDefined();
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should reject keys with invalid length', async () => {
      await expect(importKey('abc')).rejects.toThrow('64 hex characters');
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const original = 'Hello, World!';
      const encrypted = await encrypt(original, TEST_KEY);
      const decrypted = await decrypt(encrypted, TEST_KEY);
      
      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt unicode text', async () => {
      const original = '你好世界 🔐 مرحبا';
      const encrypted = await encrypt(original, TEST_KEY);
      const decrypted = await decrypt(encrypted, TEST_KEY);
      
      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt empty string', async () => {
      const original = '';
      const encrypted = await encrypt(original, TEST_KEY);
      const decrypted = await decrypt(encrypted, TEST_KEY);
      
      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt long text', async () => {
      const original = 'x'.repeat(10000);
      const encrypted = await encrypt(original, TEST_KEY);
      const decrypted = await decrypt(encrypted, TEST_KEY);
      
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const text = 'Same text';
      const enc1 = await encrypt(text, TEST_KEY);
      const enc2 = await encrypt(text, TEST_KEY);
      
      // IV should be different
      expect(enc1.iv).not.toBe(enc2.iv);
      // Content should be different due to different IV
      expect(enc1.content).not.toBe(enc2.content);
    });

    it('should return encrypted data with expected structure', async () => {
      const encrypted = await encrypt('test', TEST_KEY);
      
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('content');
      expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
      expect(typeof encrypted.content).toBe('string');
    });

    it('should fail to decrypt with wrong key', async () => {
      const encrypted = await encrypt('secret', TEST_KEY);
      const wrongKey = 'b'.repeat(64);
      
      await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
    });

    it('should fail to decrypt tampered ciphertext', async () => {
      const encrypted = await encrypt('secret', TEST_KEY);
      const tampered: EncryptedData = {
        ...encrypted,
        content: 'ff' + encrypted.content.slice(2),
      };
      
      await expect(decrypt(tampered, TEST_KEY)).rejects.toThrow();
    });
  });

  describe('encryptToString/decryptFromString', () => {
    it('should roundtrip a string through base64 encoding', async () => {
      const original = 'championship-level security';
      const encrypted = await encryptToString(original, TEST_KEY);
      const decrypted = await decryptFromString(encrypted, TEST_KEY);
      
      expect(decrypted).toBe(original);
    });

    it('should produce a valid base64 string', async () => {
      const encrypted = await encryptToString('test', TEST_KEY);
      
      // Should be valid base64
      expect(() => atob(encrypted)).not.toThrow();
      
      // Should decode to valid JSON
      const decoded = JSON.parse(atob(encrypted));
      expect(decoded).toHaveProperty('iv');
      expect(decoded).toHaveProperty('content');
    });

    it('should handle JSON data', async () => {
      const original = { name: 'John', ssn: '123-45-6789', dob: '1990-01-01' };
      const encrypted = await encryptToString(JSON.stringify(original), TEST_KEY);
      const decrypted = JSON.parse(await decryptFromString(encrypted, TEST_KEY));
      
      expect(decrypted).toEqual(original);
    });
  });

  describe('encryptFile/decryptFile', () => {
    let testFile: File;

    beforeAll(() => {
      // Create a test file
      const content = 'This is test file content with unicode: 日本語';
      const blob = new Blob([content], { type: 'text/plain' });
      testFile = new File([blob], 'test.txt', { type: 'text/plain' });
    });

    it('should encrypt and decrypt a file', async () => {
      const encrypted = await encryptFile(testFile, TEST_KEY);
      const decrypted = await decryptFile(encrypted, TEST_KEY);
      
      const originalContent = await testFile.text();
      const decryptedContent = await decrypted.text();
      
      expect(decryptedContent).toBe(originalContent);
    });

    it('should preserve file metadata', async () => {
      const encrypted = await encryptFile(testFile, TEST_KEY);
      
      expect(encrypted.metadata.name).toBe('test.txt');
      expect(encrypted.metadata.type).toBe('text/plain');
      expect(encrypted.metadata.size).toBe(testFile.size);
    });

    it('should restore correct MIME type', async () => {
      const encrypted = await encryptFile(testFile, TEST_KEY);
      const decrypted = await decryptFile(encrypted, TEST_KEY);
      
      expect(decrypted.type).toBe('text/plain');
    });

    it('should handle binary files', async () => {
      // Create a "binary" file with random bytes
      const bytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        bytes[i] = i;
      }
      const binaryFile = new File([bytes], 'binary.bin', { type: 'application/octet-stream' });
      
      const encrypted = await encryptFile(binaryFile, TEST_KEY);
      const decrypted = await decryptFile(encrypted, TEST_KEY);
      
      const originalBuffer = await binaryFile.arrayBuffer();
      const decryptedBuffer = await decrypted.arrayBuffer();
      
      expect(new Uint8Array(decryptedBuffer)).toEqual(new Uint8Array(originalBuffer));
    });
  });

  describe('security properties', () => {
    it('should use 96-bit IV (recommended for GCM)', async () => {
      const encrypted = await encrypt('test', TEST_KEY);
      // 12 bytes = 24 hex chars
      expect(encrypted.iv).toHaveLength(24);
    });

    it('should produce authenticated ciphertext', async () => {
      // GCM mode includes authentication tag
      // Modifying any part of the ciphertext should cause decryption to fail
      const encrypted = await encrypt('secret message', TEST_KEY);
      
      // Flip a bit in the middle of the content
      const chars = encrypted.content.split('');
      const midpoint = Math.floor(chars.length / 2);
      chars[midpoint] = chars[midpoint] === '0' ? '1' : '0';
      
      const modified: EncryptedData = {
        ...encrypted,
        content: chars.join(''),
      };
      
      await expect(decrypt(modified, TEST_KEY)).rejects.toThrow();
    });
  });
});

