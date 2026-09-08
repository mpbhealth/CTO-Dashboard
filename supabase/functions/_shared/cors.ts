const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://cto-dashboard-mpb-healths-projects.vercel.app',
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || DEFAULT_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const extra = (Deno.env.get('ALLOWED_ORIGIN') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allowed = [...DEFAULT_ORIGINS, ...extra];
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
  };
}
