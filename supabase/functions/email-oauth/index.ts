import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Provider configuration
interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  tenantId?: string; // Outlook only
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

// Get provider configuration from environment
function getProviderConfig(provider: 'outlook' | 'gmail'): ProviderConfig {
  if (provider === 'outlook') {
    return {
      clientId: Deno.env.get('OUTLOOK_CLIENT_ID') ?? '',
      clientSecret: Deno.env.get('OUTLOOK_CLIENT_SECRET') ?? '',
      tenantId: Deno.env.get('OUTLOOK_TENANT_ID') ?? 'common',
      redirectUri: Deno.env.get('EMAIL_OAUTH_REDIRECT_URI') ?? '',
    };
  } else {
    return {
      clientId: Deno.env.get('GMAIL_CLIENT_ID') ?? '',
      clientSecret: Deno.env.get('GMAIL_CLIENT_SECRET') ?? '',
      redirectUri: Deno.env.get('EMAIL_OAUTH_REDIRECT_URI') ?? '',
    };
  }
}

// Get OAuth scopes for each provider
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
  } else {
    return [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
    ];
  }
}

// Generate OAuth authorization URL
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
      state: state,
      prompt: 'consent',
    });
    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  } else {
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(
  provider: 'outlook' | 'gmail',
  code: string
): Promise<TokenResponse> {
  const config = getProviderConfig(provider);

  let tokenUrl: string;
  let body: URLSearchParams;

  if (provider === 'outlook') {
    const tenantId = config.tenantId || 'common';
    tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    });
  } else {
    tokenUrl = 'https://oauth2.googleapis.com/token';
    body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    });
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange error:', errorText);
    throw new Error(`Failed to exchange code for tokens: ${response.status}`);
  }

  return await response.json();
}

// Refresh access token
async function refreshAccessToken(
  provider: 'outlook' | 'gmail',
  refreshToken: string
): Promise<TokenResponse> {
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
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh error:', errorText);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  return await response.json();
}

// Get user info from provider
async function getUserInfo(
  provider: 'outlook' | 'gmail',
  accessToken: string
): Promise<UserInfo> {
  let url: string;

  if (provider === 'outlook') {
    url = 'https://graph.microsoft.com/v1.0/me';
  } else {
    url = 'https://www.googleapis.com/oauth2/v2/userinfo';
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  const data = await response.json();

  if (provider === 'outlook') {
    return {
      email: data.mail || data.userPrincipalName,
      name: data.displayName,
    };
  } else {
    return {
      email: data.email,
      name: data.name,
    };
  }
}

// Encrypt token for storage (simple encryption - consider using Supabase Vault in production)
function encryptToken(token: string): string {
  // In production, use proper encryption with Supabase Vault or similar
  // For now, we'll store tokens as-is (they're already behind RLS)
  return token;
}

function decryptToken(encryptedToken: string): string {
  return encryptedToken;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { action, provider, code, state, accountId, userId } = body;

    switch (action) {
      // Get OAuth authorization URL
      case 'getAuthUrl': {
        if (!provider || !['outlook', 'gmail'].includes(provider)) {
          throw new Error('Invalid provider. Must be "outlook" or "gmail".');
        }
        if (!userId) {
          throw new Error('userId is required');
        }

        // Create state with user info for callback verification
        const stateData = {
          provider,
          userId,
          timestamp: Date.now(),
          nonce: crypto.randomUUID(),
        };
        const stateString = btoa(JSON.stringify(stateData));

        const authUrl = getAuthorizationUrl(provider, stateString);

        return new Response(
          JSON.stringify({
            success: true,
            authUrl,
            state: stateString,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Handle OAuth callback
      case 'callback': {
        if (!code) {
          throw new Error('Authorization code is required');
        }
        if (!state) {
          throw new Error('State is required');
        }

        // Decode and verify state
        let stateData;
        try {
          stateData = JSON.parse(atob(state));
        } catch {
          throw new Error('Invalid state parameter');
        }

        const { provider: stateProvider, userId: stateUserId } = stateData;

        if (!stateProvider || !stateUserId) {
          throw new Error('Invalid state data');
        }

        // Check state age (max 10 minutes)
        if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
          throw new Error('State expired. Please try connecting again.');
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(stateProvider, code);

        // Get user info
        const userInfo = await getUserInfo(stateProvider, tokens.access_token);

        // Calculate token expiration
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in - 60);

        // Check if account already exists
        const { data: existingAccount } = await supabaseClient
          .from('user_email_accounts')
          .select('id')
          .eq('user_id', stateUserId)
          .eq('provider', stateProvider)
          .eq('email_address', userInfo.email)
          .single();

        let accountResult;

        if (existingAccount) {
          // Update existing account
          const { data, error } = await supabaseClient
            .from('user_email_accounts')
            .update({
              access_token: encryptToken(tokens.access_token),
              refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
              token_expires_at: expiresAt.toISOString(),
              display_name: userInfo.name,
              is_active: true,
              sync_error: null,
              scopes: getScopes(stateProvider),
            })
            .eq('id', existingAccount.id)
            .select()
            .single();

          if (error) throw error;
          accountResult = data;
        } else {
          // Check if this is the first account (make it default)
          const { count } = await supabaseClient
            .from('user_email_accounts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', stateUserId);

          const isFirst = (count ?? 0) === 0;

          // Create new account
          const { data, error } = await supabaseClient
            .from('user_email_accounts')
            .insert({
              user_id: stateUserId,
              provider: stateProvider,
              email_address: userInfo.email,
              display_name: userInfo.name,
              access_token: encryptToken(tokens.access_token),
              refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
              token_expires_at: expiresAt.toISOString(),
              is_default: isFirst,
              is_active: true,
              scopes: getScopes(stateProvider),
            })
            .select()
            .single();

          if (error) throw error;
          accountResult = data;
        }

        // Return success without exposing tokens
        return new Response(
          JSON.stringify({
            success: true,
            account: {
              id: accountResult.id,
              provider: accountResult.provider,
              email_address: accountResult.email_address,
              display_name: accountResult.display_name,
              is_default: accountResult.is_default,
              is_active: accountResult.is_active,
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Refresh access token
      case 'refresh': {
        if (!accountId) {
          throw new Error('accountId is required');
        }

        // Get account with refresh token
        const { data: account, error: accountError } = await supabaseClient
          .from('user_email_accounts')
          .select('*')
          .eq('id', accountId)
          .single();

        if (accountError || !account) {
          throw new Error('Account not found');
        }

        if (!account.refresh_token) {
          throw new Error('No refresh token available. Please reconnect your account.');
        }

        // Refresh the token
        const tokens = await refreshAccessToken(
          account.provider,
          decryptToken(account.refresh_token)
        );

        // Calculate new expiration
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in - 60);

        // Update account with new tokens
        const { error: updateError } = await supabaseClient
          .from('user_email_accounts')
          .update({
            access_token: encryptToken(tokens.access_token),
            refresh_token: tokens.refresh_token
              ? encryptToken(tokens.refresh_token)
              : account.refresh_token,
            token_expires_at: expiresAt.toISOString(),
            sync_error: null,
          })
          .eq('id', accountId);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({
            success: true,
            expiresAt: expiresAt.toISOString(),
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Disconnect (revoke) an account
      case 'disconnect': {
        if (!accountId) {
          throw new Error('accountId is required');
        }

        // Get account to revoke
        const { data: account, error: accountError } = await supabaseClient
          .from('user_email_accounts')
          .select('*')
          .eq('id', accountId)
          .single();

        if (accountError || !account) {
          throw new Error('Account not found');
        }

        // Try to revoke token with provider (best effort)
        try {
          if (account.provider === 'gmail' && account.access_token) {
            await fetch(
              `https://oauth2.googleapis.com/revoke?token=${decryptToken(account.access_token)}`,
              { method: 'POST' }
            );
          }
          // Note: Microsoft doesn't have a simple token revocation endpoint
        } catch (e) {
          console.log('Token revocation failed (continuing):', e);
        }

        // Delete the account from database
        const { error: deleteError } = await supabaseClient
          .from('user_email_accounts')
          .delete()
          .eq('id', accountId);

        if (deleteError) throw deleteError;

        // If this was the default account, set another one as default
        if (account.is_default) {
          const { data: otherAccounts } = await supabaseClient
            .from('user_email_accounts')
            .select('id')
            .eq('user_id', account.user_id)
            .limit(1);

          if (otherAccounts && otherAccounts.length > 0) {
            await supabaseClient
              .from('user_email_accounts')
              .update({ is_default: true })
              .eq('id', otherAccounts[0].id);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Account disconnected successfully',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get valid access token (refreshing if needed)
      case 'getAccessToken': {
        if (!accountId) {
          throw new Error('accountId is required');
        }

        const { data: account, error: accountError } = await supabaseClient
          .from('user_email_accounts')
          .select('*')
          .eq('id', accountId)
          .single();

        if (accountError || !account) {
          throw new Error('Account not found');
        }

        // Check if token needs refresh (expires in less than 5 minutes)
        const expiresAt = new Date(account.token_expires_at);
        const needsRefresh = expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

        if (needsRefresh && account.refresh_token) {
          try {
            const tokens = await refreshAccessToken(
              account.provider,
              decryptToken(account.refresh_token)
            );

            const newExpiresAt = new Date();
            newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokens.expires_in - 60);

            await supabaseClient
              .from('user_email_accounts')
              .update({
                access_token: encryptToken(tokens.access_token),
                refresh_token: tokens.refresh_token
                  ? encryptToken(tokens.refresh_token)
                  : account.refresh_token,
                token_expires_at: newExpiresAt.toISOString(),
                sync_error: null,
              })
              .eq('id', accountId);

            return new Response(
              JSON.stringify({
                success: true,
                accessToken: tokens.access_token,
                expiresAt: newExpiresAt.toISOString(),
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          } catch (e) {
            // Update sync error
            await supabaseClient
              .from('user_email_accounts')
              .update({
                sync_error: `Token refresh failed: ${e.message}`,
              })
              .eq('id', accountId);

            throw new Error('Failed to refresh token. Please reconnect your account.');
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            accessToken: decryptToken(account.access_token),
            expiresAt: account.token_expires_at,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // List connected accounts for a user
      case 'listAccounts': {
        if (!userId) {
          throw new Error('userId is required');
        }

        const { data: accounts, error } = await supabaseClient
          .from('user_email_accounts')
          .select('id, provider, email_address, display_name, is_default, is_active, last_sync_at, sync_error, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            accounts: accounts || [],
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Set default account
      case 'setDefault': {
        if (!accountId || !userId) {
          throw new Error('accountId and userId are required');
        }

        // Verify account belongs to user
        const { data: account } = await supabaseClient
          .from('user_email_accounts')
          .select('id')
          .eq('id', accountId)
          .eq('user_id', userId)
          .single();

        if (!account) {
          throw new Error('Account not found');
        }

        // Clear other defaults and set this one
        await supabaseClient
          .from('user_email_accounts')
          .update({ is_default: false })
          .eq('user_id', userId);

        await supabaseClient
          .from('user_email_accounts')
          .update({ is_default: true })
          .eq('id', accountId);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Default account updated',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in email-oauth function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
