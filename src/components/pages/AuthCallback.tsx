import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AryxLogo } from '../brand/AryxLogo';

function authTypeFromUrl(): string | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return search.get('type') || hash.get('type');
}

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!session?.user) {
          setError('No user session found');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        document.cookie = `role=cos; path=/; max-age=86400; samesite=lax`;
        const type = authTypeFromUrl();
        navigate(type === 'recovery' ? '/auth/reset-password' : '/home', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    void handleAuthCallback();
  }, [navigate]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-aryx-bg px-4 text-aryx-ink">
      <AryxLogo wordmark />
      {error ? (
        <div className="mt-8 text-center">
          <h1 className="font-display text-xl font-semibold">Authentication error</h1>
          <p className="mt-2 text-sm text-aryx-muted">{error}</p>
          <p className="mt-4 text-xs text-aryx-faint">Redirecting to login...</p>
        </div>
      ) : (
        <div className="mt-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-aryx-line border-t-aryx-accent" />
          <h1 className="font-display text-xl font-semibold">Authenticating…</h1>
          <p className="mt-2 text-sm text-aryx-muted">Setting up your COS session</p>
        </div>
      )}
    </div>
  );
}
