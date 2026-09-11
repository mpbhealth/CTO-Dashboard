const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://ceo.aryx.pro',
  'https://cos.aryxtech.com',
  'https://aryx-ceo.vercel.app',
  'https://aryx-cos.vercel.app',
];

function allowedOrigins(): string[] {
  const extra = (Deno.env.get('ALLOWED_ORIGIN') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ORIGINS, ...extra])];
}

function reflectOrigin(req?: Request): string {
  const allowed = allowedOrigins();
  const origin = req?.headers.get('Origin') || '';
  if (origin && allowed.includes(origin)) return origin;
  return allowed[0];
}

export function corsHeadersFor(req?: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': reflectOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    Vary: 'Origin',
  };
}

/** Single-origin fallback. Browser handlers must use corsHeadersFor(req). */
export const corsHeaders = corsHeadersFor();
