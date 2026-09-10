import { corsHeaders } from '../_shared/cors.ts';
import { requireUser, serviceClient } from '../_shared/auth.ts';
import { listActiveOrgIds, loadOrgLink, resolveActiveOrg } from '../_shared/org.ts';
import {
  extractAdvisorIq,
  extractCrm,
  extractEnrollment,
  extractMemberApp,
  extractSaas,
  extractTickets,
  extractTraffic,
  type ExtractorResult,
} from '../_shared/extractors.ts';

const SOURCE_KEYS = [
  'aryx_enrollment',
  'aryx_crm',
  'aryx_advisoriq',
  'it_ticketing',
  'marketflo',
  'saas_internal',
  'mpb_member',
] as const;

function safeEq(left: string, right: string): boolean {
  if (!left || !right || left.length !== right.length) return false;
  let out = 0;
  for (let i = 0; i < left.length; i += 1) out |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return out === 0;
}

function cronAuthorized(req: Request): boolean {
  const secret = Deno.env.get('COS_CRON_SECRET') || Deno.env.get('MAIL_CRON_SECRET') || '';
  if (!secret) return false;
  const header = req.headers.get('x-cron-secret') || '';
  const bearer = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  return safeEq(header, secret) || safeEq(bearer, secret);
}

async function markSource(
  admin: ReturnType<typeof serviceClient>,
  orgId: string,
  key: string,
  status: string,
  error?: string,
) {
  await admin.from('integration_sources').upsert({
    org_id: orgId,
    key,
    kind: key,
    status,
    last_success_at: status === 'healthy' ? new Date().toISOString() : undefined,
    last_error: error ?? null,
  }, { onConflict: 'org_id,key' });
}

async function syncOrg(
  admin: ReturnType<typeof serviceClient>,
  orgId: string,
  requested: string,
): Promise<ExtractorResult[]> {
  const link = await loadOrgLink(admin, orgId);
  if (!link || !link.is_active) {
    return [{ source: requested, status: 'skipped', metrics: [], error: 'org_link_missing' }];
  }

  const run = async (key: string, fn: () => Promise<ExtractorResult>) => {
    if (requested !== 'all' && requested !== key) return null;
    const idempotencyKey = `${key}:${new Date().toISOString().slice(0, 10)}`;
    await admin.from('sync_runs').upsert({
      org_id: orgId,
      source_key: key,
      idempotency_key: idempotencyKey,
      status: 'running',
      started_at: new Date().toISOString(),
    }, { onConflict: 'org_id,idempotency_key' });
    try {
      const result = await fn();
      await admin.from('sync_runs').update({
        status: result.status === 'error' ? 'failed' : 'succeeded',
        finished_at: new Date().toISOString(),
        error: result.error ?? null,
        metrics: result.metrics,
      }).eq('org_id', orgId).eq('idempotency_key', idempotencyKey);
      await markSource(
        admin,
        orgId,
        key,
        result.status === 'healthy' ? 'healthy' : result.status === 'unconfigured' ? 'unconfigured' : result.status === 'skipped' ? 'unconfigured' : 'error',
        result.error,
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'sync_failed';
      await admin.from('sync_runs').update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error: message,
      }).eq('org_id', orgId).eq('idempotency_key', idempotencyKey);
      await markSource(admin, orgId, key, 'error', message);
      return { source: key, status: 'error' as const, metrics: [], error: message };
    }
  };

  const results = await Promise.all([
    run('aryx_enrollment', () => extractEnrollment(admin, orgId, link)),
    run('aryx_crm', () => extractCrm(admin, orgId, link)),
    run('aryx_advisoriq', () => extractAdvisorIq(admin, orgId, link)),
    run('it_ticketing', () => extractTickets(admin, orgId, link)),
    run('marketflo', () => extractTraffic(admin, orgId, link)),
    run('saas_internal', () => extractSaas(admin, orgId)),
    run('mpb_member', () => extractMemberApp(admin, orgId, link)),
  ]);
  return results.filter((row): row is ExtractorResult => Boolean(row));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = serviceClient();
    const body = await req.json().catch(() => ({ source: 'all' }));
    const requested = typeof body.source === 'string' ? body.source : 'all';
    if (requested !== 'all' && !SOURCE_KEYS.includes(requested)) {
      throw new Error('unknown_source');
    }

    let orgIds: string[] = [];
    let actorId: string | null = null;

    if (cronAuthorized(req) && body.all_orgs === true) {
      orgIds = await listActiveOrgIds(admin);
    } else {
      const { userClient } = requireUser(req);
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      actorId = user.id;
      const active = await resolveActiveOrg(admin, user.id);
      if (!['owner', 'admin', 'cos'].includes(active.role)) {
        throw new Error('forbidden');
      }
      orgIds = [active.orgId];
    }

    const results = [];
    for (const orgId of orgIds) {
      const orgResults = await syncOrg(admin, orgId, requested);
      results.push({ org_id: orgId, results: orgResults });
      await admin.from('audit_events').insert({
        org_id: orgId,
        actor_id: actorId,
        action: 'connector.sync',
        entity: 'integration_sources',
        metadata: { requested, result_count: orgResults.length },
      });
    }

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
