import { corsHeaders } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/auth.ts';
import { createClient } from 'npm:@supabase/supabase-js';

const ACCOUNTS_URL = (Deno.env.get('ARYX_ACCOUNTS_URL') ?? 'https://nubejeaijuivdhggewkl.supabase.co').replace(/\/$/, '');
const ACCOUNTS_ANON = Deno.env.get('ARYX_ACCOUNTS_ANON_KEY') ?? '';
const APP_SLUG = 'cos';
const ROLE_MAP: Record<string, 'owner' | 'admin' | 'viewer'> = {
  owner: 'owner',
  admin: 'admin',
  member: 'viewer',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const ticket = String(body.ticket || '');
    if (!ticket || ticket.length > 2048) {
      return new Response(JSON.stringify({ error: 'ticket required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ACCOUNTS_ANON) {
      return new Response(JSON.stringify({ error: 'accounts_not_configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const redeemed = await fetch(`${ACCOUNTS_URL}/functions/v1/redeem-sso-ticket`, {
      method: 'POST',
      headers: {
        apikey: ACCOUNTS_ANON,
        Authorization: `Bearer ${ACCOUNTS_ANON}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ticket, app_slug: APP_SLUG }),
    });
    const claims = await redeemed.json().catch(() => ({}));
    if (!redeemed.ok) {
      return new Response(JSON.stringify({ error: claims.error || 'ticket redemption failed' }), {
        status: redeemed.status === 401 ? 401 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sub = String(claims.sub ?? '');
    const email = String(claims.email ?? '');
    const accountsOrg = String(claims.org_id ?? '');
    const role = ROLE_MAP[String(claims.member_role || 'member')] || 'viewer';
    const orgName = String(claims.org_name || 'ARYX Org').slice(0, 120);
    const orgSlug = String(claims.org_slug || `org-${accountsOrg.slice(0, 8)}`).slice(0, 80);
    const orgIdRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sub || !email || !orgIdRe.test(accountsOrg)) {
      return new Response(JSON.stringify({ error: 'ticket missing claims' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = serviceClient();
    const { data: existingLink } = await admin
      .from('cos_org_link')
      .select('org_id')
      .eq('accounts_org_id', accountsOrg)
      .maybeSingle();

    let orgId = existingLink?.org_id as string | undefined;
    if (!orgId) {
      orgId = accountsOrg;
      await admin.from('orgs').upsert({ id: orgId, name: orgName, slug: orgSlug, status: 'active' });
      await admin.from('cos_org_link').insert({
        org_id: orgId,
        accounts_org_id: accountsOrg,
        ticket_scope: 'none',
        is_active: true,
      });
      const seeds = [
        { key: 'aryx_crm', kind: 'crm', project_ref: 'knelbprqqbjggqfqvfmc' },
        { key: 'aryx_enrollment', kind: 'enrollment', project_ref: 'ciowhwoapfokiiflubxs' },
        { key: 'mpb_member', kind: 'member_app', project_ref: 'qfigouszitcddkhssqxr' },
        { key: 'it_ticketing', kind: 'ticketing', project_ref: 'hhikjgrttgnvojtunmla' },
        { key: 'marketflo', kind: 'marketing', project_ref: 'tzlvhpultquonblkkpqp' },
        { key: 'saas_internal', kind: 'saas', project_ref: null },
        { key: 'aryx_advisoriq', kind: 'advisoriq', project_ref: 'nnvqabahcepvitzblkal' },
      ];
      await admin.from('integration_sources').upsert(
        seeds.map((row) => ({ org_id: orgId, ...row, status: 'unconfigured' })),
        { onConflict: 'org_id,key' },
      );
    }

    let userId: string | undefined;
    const { data: mapped } = await admin.from('aryx_identity_map').select('user_id').eq('accounts_sub', sub).maybeSingle();
    if (mapped) {
      userId = mapped.user_id;
    } else {
      const { data: prof } = await admin.from('profiles').select('user_id').eq('email', email).maybeSingle();
      if (prof) {
        userId = prof.user_id;
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { accounts_sub: sub, provisioned_by: 'sso-exchange' },
        });
        if (createErr || !created.user) {
          throw new Error(createErr?.message || 'createUser failed');
        }
        userId = created.user.id;
      }
      await admin.from('aryx_identity_map').insert({
        accounts_sub: sub,
        user_id: userId,
        aryx_org_id: orgId,
      });
    }

    await admin.from('org_memberships').upsert({
      org_id: orgId,
      user_id: userId,
      role,
    });
    await admin.from('profiles').update({
      org_id: orgId,
      role,
      email,
    }).eq('user_id', userId);

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    const tokenHash = link?.properties?.hashed_token;
    if (linkErr || !tokenHash) throw new Error(linkErr?.message || 'generateLink failed');

    const anon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } },
    );
    const { data: verified, error: verifyErr } = await anon.auth.verifyOtp({ type: 'email', token_hash: tokenHash });
    if (verifyErr || !verified.session) throw new Error(verifyErr?.message || 'verifyOtp failed');

    return new Response(JSON.stringify({
      access_token: verified.session.access_token,
      refresh_token: verified.session.refresh_token,
      user_id: userId,
      org_id: orgId,
      role,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'sso failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
