export default async function handler(req: { method?: string; headers: Record<string, string | undefined> }, res: {
  status: (code: number) => { json: (body: unknown) => unknown; end: () => unknown };
}) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).end();
  }

  const cronSecret = process.env.CRON_SECRET || '';
  const auth = req.headers.authorization || '';
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const syncSecret = process.env.COS_CRON_SECRET || '';
  if (!supabaseUrl || !syncSecret) {
    return res.status(500).json({ error: 'cron_not_configured' });
  }

  const remote = await fetch(`${supabaseUrl}/functions/v1/connector-sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${syncSecret}`,
      'Content-Type': 'application/json',
      'x-cron-secret': syncSecret,
    },
    body: JSON.stringify({ source: 'all', all_orgs: true }),
  });

  const json = await remote.json().catch(() => ({}));
  return res.status(remote.ok ? 200 : 502).json({
    ok: remote.ok,
    org_count: Array.isArray(json.results) ? json.results.length : 0,
  });
}
