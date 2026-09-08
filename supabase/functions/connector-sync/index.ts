import { corsHeaders } from '../_shared/cors.ts';
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { CONNECTOR_SOURCES } from '../_shared/connectors.ts';

const ARYX_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

async function countTable(baseUrl: string, serviceKey: string, table: string): Promise<number> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'count=exact',
    },
  });
  if (!res.ok) {
    throw new Error(`${table} count failed (${res.status})`);
  }
  const contentRange = res.headers.get('content-range') || '0-0/0';
  const total = contentRange.split('/')[1];
  return Number(total || 0);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userClient } = requireUser(req);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const body = await req.json().catch(() => ({ source: 'all' }));
    const requested = body.source || 'all';
    const targets = CONNECTOR_SOURCES.filter((s) => requested === 'all' || requested === s.key);
    const admin = serviceClient();
    const periodStart = new Date().toISOString().slice(0, 10);
    const results = [];

    for (const source of targets) {
      const url = Deno.env.get(source.urlEnv) ?? '';
      const key = Deno.env.get(source.keyEnv) ?? '';
      const idempotencyKey = `${source.key}:${periodStart}`;

      await admin.from('sync_runs').upsert({
        org_id: ARYX_ORG_ID,
        source_key: source.key,
        idempotency_key: idempotencyKey,
        status: 'running',
        started_at: new Date().toISOString(),
      }, { onConflict: 'org_id,idempotency_key' });

      if (!url || !key) {
        await admin.from('integration_sources').update({
          status: 'unconfigured',
          last_error: 'Missing server credentials',
        }).eq('key', source.key);
        await admin.from('sync_runs').update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error: 'unconfigured',
        }).eq('org_id', ARYX_ORG_ID).eq('idempotency_key', idempotencyKey);
        results.push({ source: source.key, status: 'unconfigured', metrics: [] });
        continue;
      }

      try {
        const metrics = [];
        for (const metric of source.metrics) {
          const value = await countTable(url, key, metric.table);
          metrics.push({ source: source.key, metric_key: metric.metric, value, period_start: periodStart });
          await admin.from('analytics_snapshots').upsert({
            org_id: ARYX_ORG_ID,
            source: source.key,
            metric_key: metric.metric,
            period_start: periodStart,
            value,
            metadata: { auto_generated: true },
          }, { onConflict: 'org_id,source,metric_key,period_start' });
        }
        await admin.from('integration_sources').update({
          status: 'healthy',
          last_success_at: new Date().toISOString(),
          last_error: null,
        }).eq('key', source.key);
        await admin.from('sync_runs').update({
          status: 'succeeded',
          finished_at: new Date().toISOString(),
          metrics,
        }).eq('org_id', ARYX_ORG_ID).eq('idempotency_key', idempotencyKey);
        results.push({ source: source.key, status: 'healthy', metrics });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'sync failed';
        await admin.from('integration_sources').update({
          status: 'error',
          last_error: message,
        }).eq('key', source.key);
        await admin.from('sync_runs').update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error: message,
        }).eq('org_id', ARYX_ORG_ID).eq('idempotency_key', idempotencyKey);
        results.push({ source: source.key, status: 'error', metrics: [], error: message });
      }
    }

    await admin.from('audit_events').insert({
      org_id: ARYX_ORG_ID,
      actor_id: user.id,
      action: 'connector.sync',
      entity: 'integration_sources',
      metadata: { requested },
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'sync failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
