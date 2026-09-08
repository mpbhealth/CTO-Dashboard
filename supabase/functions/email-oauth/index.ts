import { corsHeaders } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/auth.ts';
import { encryptToken, decryptToken } from '../_shared/crypto.ts';
import { requireCaller } from '../_shared/caller.ts';

interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  tenantId?: string;
  redirectUri: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface UserInfo {
  email: string;
  name?: string;
}

function getProviderConfig(provider: 'outlook' | 'gmail'): ProviderConfig {
  if (provider === 'outlook') {
    return {
      clientId: Deno.env.get('OUTLOOK_CLIENT_ID') ?? '',
      clientSecret: Deno.env.get('OUTLOOK_CLIENT_SECRET') ?? '',
      tenantId: Deno.env.get('OUTLOOK_TENANT_ID') ?? 'common',
      redirectUri: Deno.env.get('EMAIL_OAUTH_REDIRECT_URI') ?? '',
    };
  }
  return {
    clientId: Deno.env.get('GMAIL_CLIENT_ID') ?? '',
    clientSecret: Deno.env.get('GMAIL_CLIENT_SECRET') ?? '',
    redirectUri: Deno.env.get('EMAIL_OAUTH_REDIRECT_URI') ?? '',
  };
}

function getScopes(provider: 'outlook' | 'gmail'): string[] {
  if (provider === 'outlook') {
    return [
      'openid',
      'profile',
      'email',
      'offline_access',
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.ReadWrite',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/User.Read',
    ];
  }
  return [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ];
}

function getAuthorizationUrl(provider: 'outlook' | 'gmail', state: string): string {
  const config = getProviderConfig(provider);
  const scopes = getScopes(provider);

  if (provider === 'outlook') {
    const tenantId = config.tenantId || 'common';
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      response_mode: 'query',
      scope: scopes.join(' '),
      state,
      prompt: 'consent',
    });
    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: scopes.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(provider: 'outlook' | 'gmail', code: string): Promise<TokenResponse> {
  const config = getProviderConfig(provider);
  let tokenUrl: string;
  let body: URLSearchParams;

  if (provider === 'outlook') {
    const tenantId = config.tenantId || 'common';
    tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    });
  } else {
    tokenUrl = 'https://oauth2.googleapis.com/token';
    body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    });
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) {
    throw new Error(`Failed to exchange code for tokens: ${response.status}`);
  }
  return await response.json();
}

async function refreshAccessToken(provider: 'outlook' | 'gmail', refreshToken: string): Promise<TokenResponse> {
  const config = getProviderConfig(provider);
  let tokenUrl: string;
  let body: URLSearchParams;

  if (provider === 'outlook') {
    const tenantId = config.tenantId || 'common';
    tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
  } else {
    tokenUrl = 'https://oauth2.googleapis.com/token';
    body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.status}`);
  }
  return await response.json();
}

async function getUserInfo(provider: 'outlook' | 'gmail', accessToken: string): Promise<UserInfo> {
  const url = provider === 'outlook'
    ? 'https://graph.microsoft.com/v1.0/me'
    : 'https://www.googleapis.com/oauth2/v2/userinfo';
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Failed to get user info: ${response.status}`);
  const data = await response.json();
  if (provider === 'outlook') {
    return { email: data.mail || data.userPrincipalName, name: data.displayName };
  }
  return { email: data.email, name: data.name };
}

function publicAccount(row: Record<string, unknown>) {
  return {
    id: row.id,
    provider: row.provider,
    email_address: row.email_address,
    display_name: row.display_name,
    is_default: row.is_default,
    is_active: row.is_active,
    status: row.status,
    last_sync_at: row.last_sync_at,
    sync_error: row.sync_error,
    created_at: row.created_at,
  };
}

async function assertAccountOwner(admin: ReturnType<typeof serviceClient>, accountId: string, userId: string | null, service: boolean) {
  const { data: account, error } = await admin.from('mail_accounts').select('*').eq('id', accountId).single();
  if (error || !account) throw new Error('Account not found');
  if (!service && account.owner_user_id !== userId) throw new Error('Account not found');
  return account;
}

async function persistTokens(
  admin: ReturnType<typeof serviceClient>,
  accountId: string,
  tokens: TokenResponse,
  extras: Record<string, unknown> = {},
) {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in - 60);
  const payload: Record<string, unknown> = {
    encrypted_access_token: await encryptToken(tokens.access_token),
    token_expires_at: expiresAt.toISOString(),
    status: 'active',
    sync_error: null,
    ...extras,
  };
  if (tokens.refresh_token) {
    payload.encrypted_refresh_token = await encryptToken(tokens.refresh_token);
  }
  const { error } = await admin.from('mail_accounts').update(payload).eq('id', accountId);
  if (error) throw error;
  return expiresAt;
}

async function createOutlookSubscription(accessToken: string, accountId: string) {
  const webhook = Deno.env.get('MAIL_WEBHOOK_URL');
  if (!webhook) return null;
  const expires = new Date(Date.now() + 4000 * 60 * 1000).toISOString();
  const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      changeType: 'created,updated',
      notificationUrl: webhook,
      resource: 'me/mailFolders/inbox/messages',
      expirationDateTime: expires,
      clientState: accountId,
    }),
  });
  if (!response.ok) return null;
  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const admin = serviceClient();
    const caller = await requireCaller(req);
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, provider, code, state, accountId, userId } = body;
    const effectiveUserId = caller.service ? userId : caller.userId;
    if (!caller.service && userId && userId !== caller.userId) {
      throw new Error('Not authorized');
    }

    switch (action) {
      case 'getAuthUrl': {
        if (!provider || !['outlook', 'gmail'].includes(provider)) {
          throw new Error('Invalid provider. Must be "outlook" or "gmail".');
        }
        if (!effectiveUserId) throw new Error('userId is required');
        const stateData = {
          provider,
          userId: effectiveUserId,
          timestamp: Date.now(),
          nonce: crypto.randomUUID(),
        };
        const stateString = btoa(JSON.stringify(stateData));
        return new Response(JSON.stringify({
          success: true,
          authUrl: getAuthorizationUrl(provider, stateString),
          state: stateString,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'callback': {
        if (!code || !state) throw new Error('Authorization code and state are required');
        let stateData;
        try {
          stateData = JSON.parse(atob(state));
        } catch {
          throw new Error('Invalid state parameter');
        }
        const { provider: stateProvider, userId: stateUserId } = stateData;
        if (!stateProvider || !stateUserId) throw new Error('Invalid state data');
        if (!caller.service && stateUserId !== caller.userId) throw new Error('Not authorized');
        if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
          throw new Error('State expired. Please try connecting again.');
        }

        const tokens = await exchangeCodeForTokens(stateProvider, code);
        const userInfo = await getUserInfo(stateProvider, tokens.access_token);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in - 60);

        const { data: existingAccount } = await admin
          .from('mail_accounts')
          .select('id')
          .eq('owner_user_id', stateUserId)
          .eq('provider', stateProvider)
          .eq('email_address', userInfo.email)
          .maybeSingle();

        const tokenFields = {
          encrypted_access_token: await encryptToken(tokens.access_token),
          encrypted_refresh_token: tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null,
          token_expires_at: expiresAt.toISOString(),
          display_name: userInfo.name,
          granted_scopes: getScopes(stateProvider),
          status: 'active',
          is_active: true,
          sync_error: null,
        };

        let accountResult;
        if (existingAccount) {
          const { data, error } = await admin
            .from('mail_accounts')
            .update(tokenFields)
            .eq('id', existingAccount.id)
            .select('id, provider, email_address, display_name, is_default, is_active, status, last_sync_at, created_at')
            .single();
          if (error) throw error;
          accountResult = data;
        } else {
          const { count } = await admin
            .from('mail_accounts')
            .select('id', { count: 'exact', head: true })
            .eq('owner_user_id', stateUserId);
          const { data, error } = await admin
            .from('mail_accounts')
            .insert({
              owner_user_id: stateUserId,
              provider: stateProvider,
              email_address: userInfo.email,
              is_default: (count ?? 0) === 0,
              ...tokenFields,
            })
            .select('id, provider, email_address, display_name, is_default, is_active, status, last_sync_at, created_at')
            .single();
          if (error) throw error;
          accountResult = data;
        }

        if (stateProvider === 'outlook') {
          const sub = await createOutlookSubscription(tokens.access_token, accountResult.id);
          if (sub?.id) {
            await admin.from('mail_subscriptions').insert({
              mail_account_id: accountResult.id,
              provider_subscription_id: sub.id,
              resource: sub.resource,
              expires_at: sub.expirationDateTime,
              last_renewed_at: new Date().toISOString(),
            });
          }
        }

        const { data: existingCursor } = await admin
          .from('mail_sync_cursors')
          .select('id')
          .eq('mail_account_id', accountResult.id)
          .limit(1)
          .maybeSingle();
        if (!existingCursor) {
          await admin.from('mail_sync_cursors').insert({
            mail_account_id: accountResult.id,
            cursor_type: stateProvider === 'gmail' ? 'history' : 'delta',
            cursor_value: 'bootstrap',
            last_advanced_at: new Date().toISOString(),
          });
        }

        return new Response(JSON.stringify({ success: true, account: publicAccount(accountResult) }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'refresh': {
        if (!accountId) throw new Error('accountId is required');
        const account = await assertAccountOwner(admin, accountId, caller.userId, caller.service);
        if (!account.encrypted_refresh_token) {
          throw new Error('No refresh token available. Please reconnect your account.');
        }
        const tokens = await refreshAccessToken(account.provider, await decryptToken(account.encrypted_refresh_token));
        const expiresAt = await persistTokens(admin, accountId, tokens);
        return new Response(JSON.stringify({ success: true, expiresAt: expiresAt.toISOString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        if (!accountId) throw new Error('accountId is required');
        const account = await assertAccountOwner(admin, accountId, caller.userId, caller.service);
        try {
          if (account.provider === 'gmail' && account.encrypted_access_token) {
            await fetch(`https://oauth2.googleapis.com/revoke?token=${await decryptToken(account.encrypted_access_token)}`, { method: 'POST' });
          }
        } catch {
          // best effort
        }
        const { error: deleteError } = await admin.from('mail_accounts').delete().eq('id', accountId);
        if (deleteError) throw deleteError;
        if (account.is_default) {
          const { data: otherAccounts } = await admin
            .from('mail_accounts')
            .select('id')
            .eq('owner_user_id', account.owner_user_id)
            .limit(1);
          if (otherAccounts?.[0]) {
            await admin.from('mail_accounts').update({ is_default: true }).eq('id', otherAccounts[0].id);
          }
        }
        return new Response(JSON.stringify({ success: true, message: 'Account disconnected successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getAccessToken': {
        if (!caller.service) throw new Error('Access tokens are not exposed to the browser');
        if (!accountId) throw new Error('accountId is required');
        const account = await assertAccountOwner(admin, accountId, caller.userId, true);
        const expiresAt = new Date(account.token_expires_at);
        const needsRefresh = expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
        if (needsRefresh && account.encrypted_refresh_token) {
          const tokens = await refreshAccessToken(account.provider, await decryptToken(account.encrypted_refresh_token));
          const newExpiresAt = await persistTokens(admin, accountId, tokens);
          return new Response(JSON.stringify({
            success: true,
            accessToken: tokens.access_token,
            expiresAt: newExpiresAt.toISOString(),
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({
          success: true,
          accessToken: await decryptToken(account.encrypted_access_token),
          expiresAt: account.token_expires_at,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'listAccounts': {
        if (!effectiveUserId) throw new Error('userId is required');
        const { data: accounts, error } = await admin
          .from('mail_accounts')
          .select('id, provider, email_address, display_name, is_default, is_active, status, last_sync_at, sync_error, created_at')
          .eq('owner_user_id', effectiveUserId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, accounts: accounts || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'setDefault': {
        if (!accountId || !effectiveUserId) throw new Error('accountId and userId are required');
        await assertAccountOwner(admin, accountId, effectiveUserId, false);
        await admin.from('mail_accounts').update({ is_default: false }).eq('owner_user_id', effectiveUserId);
        await admin.from('mail_accounts').update({ is_default: true }).eq('id', accountId);
        return new Response(JSON.stringify({ success: true, message: 'Default account updated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
