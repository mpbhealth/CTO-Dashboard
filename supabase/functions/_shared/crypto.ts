function bytesToB64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function b64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey() {
  const secret = Deno.env.get('MAIL_TOKEN_ENCRYPTION_KEY') ?? '';
  if (!secret) throw new Error('MAIL_TOKEN_ENCRYPTION_KEY is not configured');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptToken(token: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token));
  const packed = new Uint8Array(iv.length + new Uint8Array(cipher).length);
  packed.set(iv);
  packed.set(new Uint8Array(cipher), iv.length);
  return `v1:${bytesToB64(packed)}`;
}

export async function decryptToken(payload: string): Promise<string> {
  if (!payload) return '';
  if (!payload.startsWith('v1:')) {
    throw new Error('Token is not encrypted; reconnect the mailbox');
  }
  const key = await importKey();
  const packed = b64ToBytes(payload.slice(3));
  const iv = packed.slice(0, 12);
  const data = packed.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(plain);
}
