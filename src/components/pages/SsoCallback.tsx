import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AryxLogo } from '../brand/AryxLogo';

export function SsoCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
      const ticket = new URLSearchParams(raw).get('ticket');
      window.history.replaceState({}, document.title, window.location.pathname);
      if (!ticket) {
        setError('This sign-in link is invalid or has expired.');
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sso-exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket }),
      });
      const json = await res.json();
      if (!res.ok || !json.access_token || !json.refresh_token) {
        setError(json.error || 'SSO exchange failed');
        return;
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: json.access_token,
        refresh_token: json.refresh_token,
      });
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      window.location.replace('/home');
    }
    void run();
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-aryx-bg text-aryx-ink">
      <AryxLogo wordmark />
      <p className="mt-6 text-sm text-aryx-muted">{error || 'Opening COS…'}</p>
    </div>
  );
}

export default SsoCallback;
