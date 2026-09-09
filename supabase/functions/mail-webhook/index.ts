import { serviceClient } from '../_shared/auth.ts';

type GraphNotification = {
  subscriptionId?: string;
  clientState?: string;
  changeType?: string;
  resource?: string;
  lifecycleEvent?: string;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const validationToken = url.searchParams.get('validationToken');
  if (validationToken) {
    return new Response(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let payload: { value?: GraphNotification[] };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const notifications = Array.isArray(payload?.value) ? payload.value : [];
  if (notifications.length === 0) {
    return json(401, { error: 'Unauthorized' });
  }

  const admin = serviceClient();
  const accepted: string[] = [];

  for (const note of notifications) {
    const clientState = note.clientState?.trim();
    const subscriptionId = note.subscriptionId?.trim();
    if (!clientState || !subscriptionId) {
      return json(401, { error: 'Unauthorized' });
    }

    const { data: account } = await admin
      .from('mail_accounts')
      .select('id, status')
      .eq('id', clientState)
      .maybeSingle();

    if (!account) {
      return json(401, { error: 'Unauthorized' });
    }

    const { data: subscription } = await admin
      .from('mail_subscriptions')
      .select('id, mail_account_id')
      .eq('provider_subscription_id', subscriptionId)
      .eq('mail_account_id', account.id)
      .maybeSingle();

    if (!subscription) {
      return json(401, { error: 'Unauthorized' });
    }

    if (note.lifecycleEvent === 'reauthorizationRequired' || note.lifecycleEvent === 'subscriptionRemoved') {
      await admin.from('mail_accounts').update({
        status: 'reauth_required',
        sync_error: `Graph lifecycle: ${note.lifecycleEvent}`,
      }).eq('id', account.id);
    } else {
      await admin.from('mail_accounts').update({
        last_sync_at: new Date().toISOString(),
        status: account.status === 'disconnected' ? account.status : 'active',
        sync_error: null,
      }).eq('id', account.id);
      await admin.from('mail_sync_cursors').update({
        last_advanced_at: new Date().toISOString(),
      }).eq('mail_account_id', account.id);
    }

    accepted.push(account.id);
  }

  return json(202, { accepted: accepted.length });
});
