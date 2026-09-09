export function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

export function bearerToken(req: Request): string {
  const headerSecret = (req.headers.get('x-cron-secret') || '').trim();
  if (headerSecret) return headerSecret;
  const header = req.headers.get('Authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return (match?.[1] || '').trim();
}

export function requireCronSecret(req: Request, envName = 'MAIL_CRON_SECRET'): Response | null {
  const expected = Deno.env.get(envName) ?? '';
  if (!expected) {
    return new Response(JSON.stringify({ error: `${envName} is not configured` }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const provided = bearerToken(req);
  if (!provided || !safeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
