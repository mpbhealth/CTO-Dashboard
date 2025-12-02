/**
 * AES-256-GCM Encryption Utilities
 * 
 * Browser-based encryption using the WebCrypto API.
 * All functions are async as WebCrypto operations are promise-based.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits recommended for GCM

/**
 * Convert a hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

/**
 * Import a hex-encoded AES-256 key for use with WebCrypto
 */
export async function importKey(hexKey: string): Promise<CryptoKey> {
  if (hexKey.length !== 64) {
    throw new Error('AES-256 key must be 64 hex characters (256 bits)');
  }
  
  const keyBytes = hexToBytes(hexKey);
  
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGORITHM },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  /** Initialization vector (hex) */
  iv: string;
  /** Encrypted content (hex) - includes auth tag in GCM mode */
  content: string;
}

/**
 * Encrypt a string using AES-256-GCM
 * 
 * @param text - Plain text to encrypt
 * @param hexKey - 64-character hex key (256 bits)
 * @returns Encrypted data with IV and ciphertext
 */
export async function encrypt(text: string, hexKey: string): Promise<EncryptedData> {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(text);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );
  
  return {
    iv: bytesToHex(iv),
    content: bytesToHex(new Uint8Array(ciphertext)),
  };
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * 
 * @param encrypted - Object containing iv and content as hex strings
 * @param hexKey - 64-character hex key (256 bits)
 * @returns Decrypted plain text
 */
export async function decrypt(encrypted: EncryptedData, hexKey: string): Promise<string> {
  const key = await importKey(hexKey);
  const iv = hexToBytes(encrypted.iv);
  const ciphertext = hexToBytes(encrypted.content);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt text and return as a single base64 string
 * Useful for storing in database fields
 * 
 * @param text - Plain text to encrypt
 * @param hexKey - 64-character hex key (256 bits)
 * @returns Base64-encoded JSON payload
 */
export async function encryptToString(text: string, hexKey: string): Promise<string> {
  const encrypted = await encrypt(text, hexKey);
  const payload = JSON.stringify(encrypted);
  return btoa(payload);
}

/**
 * Decrypt a base64-encoded payload back to plain text
 * 
 * @param payload - Base64-encoded encrypted payload
 * @param hexKey - 64-character hex key (256 bits)
 * @returns Decrypted plain text
 */
export async function decryptFromString(payload: string, hexKey: string): Promise<string> {
  const decoded = JSON.parse(atob(payload)) as EncryptedData;
  return decrypt(decoded, hexKey);
}

/**
 * Encrypted file data structure
 */
export interface EncryptedFileData {
  /** Initialization vector (hex) */
  iv: string;
  /** Encrypted file content as base64 */
  content: string;
  /** Original file metadata */
  metadata: {
    name: string;
    type: string;
    size: number;
  };
}

/**
 * Encrypt a File object for secure upload
 * 
 * @param file - File to encrypt
 * @param hexKey - 64-character hex key (256 bits)
 * @returns Encrypted file data with metadata
 */
export async function encryptFile(file: File, hexKey: string): Promise<EncryptedFileData> {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const arrayBuffer = await file.arrayBuffer();
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    arrayBuffer
  );
  
  return {
    iv: bytesToHex(iv),
    content: bytesToBase64(new Uint8Array(ciphertext)),
    metadata: {
      name: file.name,
      type: file.type,
      size: file.size,
    },
  };
}

/**
 * Decrypt file data back to a Blob
 * 
 * @param encryptedFile - Encrypted file data
 * @param hexKey - 64-character hex key (256 bits)
 * @returns Decrypted Blob with original MIME type
 */
export async function decryptFile(
  encryptedFile: EncryptedFileData,
  hexKey: string
): Promise<Blob> {
  const key = await importKey(hexKey);
  const iv = hexToBytes(encryptedFile.iv);
  const ciphertext = base64ToBytes(encryptedFile.content);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  
  return new Blob([decrypted], { type: encryptedFile.metadata.type });
}

/**
 * Encrypt an ArrayBuffer directly
 * 
 * @param data - ArrayBuffer to encrypt
 * @param hexKey - 64-character hex key (256 bits)
 * @returns Object with iv and encrypted content as ArrayBuffer
 */
export async function encryptArrayBuffer(
  data: ArrayBuffer,
  hexKey: string
): Promise<{ iv: Uint8Array; content: ArrayBuffer }> {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  return { iv, content: ciphertext };
}

/**
 * Decrypt an ArrayBuffer
 * 
 * @param iv - Initialization vector
 * @param content - Encrypted ArrayBuffer
 * @param hexKey - 64-character hex key (256 bits)
 * @returns Decrypted ArrayBuffer
 */
export async function decryptArrayBuffer(
  iv: Uint8Array,
  content: ArrayBuffer,
  hexKey: string
): Promise<ArrayBuffer> {
  const key = await importKey(hexKey);
  
  return crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    content
  );
}

/**
 * Generate a random encryption key (for development/testing)
 * In production, use the server-side script to generate keys
 * 
 * @returns 64-character hex key
 */
export function generateKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}

