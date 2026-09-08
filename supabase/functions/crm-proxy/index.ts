import { corsHeaders } from '../_shared/cors.ts';
import { requireUser, serviceClient } from '../_shared/auth.ts';

const ARYX_ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const CRM_APP_HREF = Deno.env.get('ARYX_CRM_APP_URL') ?? 'https://crm.aryx.com';

function crmHeaders() {
  const key = Deno.env.get('ARYX_CRM_SERVICE_ROLE_KEY') ?? '';
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

function displayName(row: Record<string, unknown>): string {
  const first = typeof row.first_name === 'string' ? row.first_name : '';
  const last = typeof row.last_name === 'string' ? row.last_name : '';
  const joined = [first, last].filter(Boolean).join(' ');
  if (joined) return joined;
  if (typeof row.email === 'string' && row.email) return row.email;
  return 'Untitled';
}

function recordHref(kind: string, id: string): string {
  return kind === 'contact' ? `${CRM_APP_HREF}/contacts/${id}` : `${CRM_APP_HREF}/leads/${id}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userClient } = requireUser(req);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const crmUrl = (Deno.env.get('ARYX_CRM_URL') ?? '').replace(/\/$/, '');
    const crmKey = Deno.env.get('ARYX_CRM_SERVICE_ROLE_KEY') ?? '';
    if (!crmUrl || !crmKey) {
      throw new Error('ARYX CRM connector is not configured');
    }

    const body = await req.json();
    const admin = serviceClient();

    if (body.action === 'list') {
      const [leadsRes, contactsRes] = await Promise.all([
        fetch(`${crmUrl}/rest/v1/lead_submissions?select=id,email,first_name,last_name,pipeline_stage,updated_at&order=updated_at.desc&limit=50`, { headers: crmHeaders() }),
        fetch(`${crmUrl}/rest/v1/crm_contacts?select=id,email,first_name,last_name,lifecycle_stage,updated_at&order=updated_at.desc&limit=50`, { headers: crmHeaders() }),
      ]);
      const leads = leadsRes.ok ? await leadsRes.json() : [];
      const contacts = contactsRes.ok ? await contactsRes.json() : [];
      const records = [
        ...((Array.isArray(leads) ? leads : []).map((row) => ({
          id: row.id,
          kind: 'lead',
          name: displayName(row),
          email: row.email ?? null,
          status: row.pipeline_stage ?? null,
          updated_at: row.updated_at ?? null,
          href: recordHref('lead', row.id),
        }))),
        ...((Array.isArray(contacts) ? contacts : []).map((row) => ({
          id: row.id,
          kind: 'contact',
          name: displayName(row),
          email: row.email ?? null,
          status: row.lifecycle_stage ?? null,
          updated_at: row.updated_at ?? null,
          href: recordHref('contact', row.id),
        }))),
      ];
      return new Response(JSON.stringify({ records }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'detail') {
      const kind = body.kind === 'contact' ? 'contact' : 'lead';
      const table = kind === 'contact' ? 'crm_contacts' : 'lead_submissions';
      const select = kind === 'contact'
        ? 'id,email,first_name,last_name,lifecycle_stage,updated_at'
        : 'id,email,first_name,last_name,pipeline_stage,updated_at';
      const res = await fetch(`${crmUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(body.id)}&select=${select}&limit=1`, {
        headers: crmHeaders(),
      });
      const rows = res.ok ? await res.json() : [];
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) throw new Error('Record not found');

      await admin.from('phi_access_log').insert({
        org_id: ARYX_ORG_ID,
        actor_id: user.id,
        source: 'aryx_crm',
        object_type: kind,
        object_id: String(body.id),
        purpose: 'cos_crm_workspace',
      });

      return new Response(JSON.stringify({
        record: {
          id: row.id,
          kind,
          name: displayName(row),
          email: row.email ?? null,
          status: row.pipeline_stage ?? row.lifecycle_stage ?? null,
          updated_at: row.updated_at ?? null,
          href: recordHref(kind, row.id),
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'matchEmails') {
      const emails = Array.from(new Set((body.emails || []).map((e: string) => String(e || '').trim().toLowerCase()).filter(Boolean))) as string[];
      const candidates = [];
      for (const email of emails.slice(0, 8)) {
        const [leadRes, contactRes] = await Promise.all([
          fetch(`${crmUrl}/rest/v1/lead_submissions?email=eq.${encodeURIComponent(email)}&select=id,email,first_name,last_name,pipeline_stage&limit=5`, { headers: crmHeaders() }),
          fetch(`${crmUrl}/rest/v1/crm_contacts?email=eq.${encodeURIComponent(email)}&select=id,email,first_name,last_name,lifecycle_stage&limit=5`, { headers: crmHeaders() }),
        ]);
        const leads = leadRes.ok ? await leadRes.json() : [];
        const contacts = contactRes.ok ? await contactRes.json() : [];
        const matches = [
          ...((Array.isArray(leads) ? leads : []).map((row) => ({
            id: row.id,
            kind: 'lead',
            name: displayName(row),
            email,
            href: recordHref('lead', row.id),
          }))),
          ...((Array.isArray(contacts) ? contacts : []).map((row) => ({
            id: row.id,
            kind: 'contact',
            name: displayName(row),
            email,
            href: recordHref('contact', row.id),
          }))),
        ];
        candidates.push({ email, matches, ambiguous: matches.length !== 1 });
      }
      return new Response(JSON.stringify({ candidates }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unknown action');
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'CRM proxy failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
