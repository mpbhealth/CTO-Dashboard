import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!session?.user) {
          setError('No user session found');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        const role = profile?.role || 'staff';

        document.cookie = `role=${role}; path=/; max-age=86400; samesite=lax`;
        if (profile?.display_name) {
          document.cookie = `display_name=${profile.display_name}; path=/; max-age=86400; samesite=lax`;
        }

        let redirectPath = '/ctod/home';
        if (role === 'ceo' || role === 'admin') {
          redirectPath = '/ceod/home';
        } else if (role === 'cto') {
          redirectPath = '/ctod/home';
        } else {
          redirectPath = '/ctod/home';
        }

        console.log(`[AuthCallback] Redirecting ${role} to ${redirectPath}`);
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h1>
        <p className="text-gray-600">Please wait while we set up your session</p>
      </div>
    </div>
  );
}
