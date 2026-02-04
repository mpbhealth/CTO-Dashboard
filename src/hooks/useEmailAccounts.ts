import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EmailAccount, EmailProvider } from '@/types/email';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface UseEmailAccountsOptions {
  userId?: string;
  autoFetch?: boolean;
}

export function useEmailAccounts(options: UseEmailAccountsOptions = {}) {
  const { userId, autoFetch = true } = options;
  const queryClient = useQueryClient();
  const [connectingProvider, setConnectingProvider] = useState<EmailProvider | null>(null);

  // Fetch accounts
  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<EmailAccount[]>({
    queryKey: ['emailAccounts', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/email-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          action: 'listAccounts',
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const result = await response.json();
      return result.accounts || [];
    },
    enabled: autoFetch && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Connect account (initiate OAuth)
  const connectAccount = useCallback(async (provider: EmailProvider) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setConnectingProvider(provider);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/email-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          action: 'getAuthUrl',
          provider,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }

      const result = await response.json();

      if (!result.authUrl) {
        throw new Error('No auth URL returned');
      }

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        result.authUrl,
        'emailOAuth',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );

      if (!popup) {
        throw new Error('Failed to open popup. Please allow popups for this site.');
      }

      // Listen for OAuth callback
      return new Promise<EmailAccount>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setConnectingProvider(null);
            reject(new Error('OAuth cancelled'));
          }
        }, 500);

        // Listen for message from popup
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data?.type === 'oauth_callback') {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            popup.close();

            if (event.data.error) {
              setConnectingProvider(null);
              reject(new Error(event.data.error));
              return;
            }

            // Exchange code for tokens
            try {
              const callbackResponse = await fetch(`${SUPABASE_URL}/functions/v1/email-oauth`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.session.access_token}`,
                },
                body: JSON.stringify({
                  action: 'callback',
                  code: event.data.code,
                  state: event.data.state,
                }),
              });

              const callbackResult = await callbackResponse.json();

              if (!callbackResult.success) {
                throw new Error(callbackResult.error || 'OAuth callback failed');
              }

              // Refresh accounts list
              await queryClient.invalidateQueries({ queryKey: ['emailAccounts', userId] });

              setConnectingProvider(null);
              resolve(callbackResult.account);
            } catch (e) {
              setConnectingProvider(null);
              reject(e);
            }
          }
        };

        window.addEventListener('message', handleMessage);
      });
    } catch (e) {
      setConnectingProvider(null);
      throw e;
    }
  }, [userId, queryClient]);

  // Disconnect account
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/email-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          action: 'disconnect',
          accountId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailAccounts', userId] });
    },
  });

  // Set default account
  const setDefaultMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/email-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          action: 'setDefault',
          accountId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set default account');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailAccounts', userId] });
    },
  });

  // Get default account
  const defaultAccount = accounts.find((a) => a.is_default) || accounts[0];

  return {
    accounts,
    defaultAccount,
    isLoading,
    error,
    refetch,
    connectAccount,
    disconnectAccount: disconnectMutation.mutateAsync,
    setDefaultAccount: setDefaultMutation.mutateAsync,
    connectingProvider,
    isDisconnecting: disconnectMutation.isPending,
  };
}

export default useEmailAccounts;
