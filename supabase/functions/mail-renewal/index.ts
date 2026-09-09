import { corsHeaders } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/auth.ts';
import { decryptToken } from '../_shared/crypto.ts';
import { requireCronSecret } from '../_shared/secrets.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const denied = requireCronSecret(req);
  if (denied) return denied;

  const admin = serviceClient();
  const horizon = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const { data: due, error } = await admin
    .from('mail_subscriptions')
    .select('id, mail_account_id, provider_subscription_id, expires_at, renewal_failure_count')
    .lt('expires_at', horizon);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = due || [];
  let renewed = 0;
  let failed = 0;

  for (const row of rows) {
    const { data: account } = await admin
      .from('mail_accounts')
      .select('id, provider, encrypted_access_token, status')
      .eq('id', row.mail_account_id)
      .maybeSingle();

    if (!account?.encrypted_access_token || !row.provider_subscription_id) {
      failed += 1;
      continue;
    }

    try {
      const token = await decryptToken(account.encrypted_access_token);
      const expires = new Date(Date.now() + 4000 * 60 * 1000).toISOString();
      const response = await fetch(`https://graph.microsoft.com/v1.0/subscriptions/${row.provider_subscription_id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expirationDateTime: expires }),
      });

      if (!response.ok) {
        throw new Error(`Graph renewal failed: ${response.status}`);
      }

      await admin.from('mail_subscriptions').update({
        last_renewed_at: new Date().toISOString(),
        renewal_failure_count: 0,
        expires_at: expires,
      }).eq('id', row.id);
      await admin.from('mail_accounts').update({
        status: 'active',
        last_sync_at: new Date().toISOString(),
      }).eq('id', row.mail_account_id);
      renewed += 1;
    } catch (cause) {
      console.error('mail-renewal row failed', row.id, cause);
      failed += 1;
      const nextCount = (row.renewal_failure_count || 0) + 1;
      await admin.from('mail_subscriptions').update({
        renewal_failure_count: nextCount,
      }).eq('id', row.id);
      if (nextCount >= 3) {
        await admin.from('mail_accounts').update({
          status: 'reauth_required',
          sync_error: 'Mailbox subscription renewal failed',
        }).eq('id', row.mail_account_id);
      }
    }
  }

  return new Response(JSON.stringify({ due: rows.length, renewed, failed }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
