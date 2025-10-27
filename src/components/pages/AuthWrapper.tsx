import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getCurrentProfile } from '../../lib/dualDashboard';
import Login from './Login';
import { User } from '@supabase/supabase-js';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Checking authentication...');
  const [error, setError] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - running in demo mode');
      setUser({ id: 'demo-user', email: 'demo@example.com' } as User);
      setLoading(false);
      setProfileChecked(true);
      return;
    }

    const getSession = async () => {
      try {
        setLoadingMessage('Checking authentication...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
          await checkProfileAndRedirect(session.user);
        } else {
          setUser(null);
          setProfileChecked(true);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setUser(null);
        setProfileChecked(true);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfileChecked(false);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setLoading(true);
          await checkProfileAndRedirect(session.user);
          setLoading(false);
        }

        if (session?.user && !profileChecked) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkProfileAndRedirect = async (authUser: User) => {
    try {
      console.log('[AuthWrapper] Starting checkProfileAndRedirect for user:', authUser.email);
      setLoadingMessage('Loading your profile...');

      const profile = await getCurrentProfile();
      console.log('[AuthWrapper] getCurrentProfile returned:', profile);

      if (!profile) {
        console.error('[AuthWrapper] Profile not found - showing error');
        setError('Profile not found. Please contact your administrator or try logging in again.');
        await supabase.auth.signOut();
        setProfileChecked(true);
        return;
      }

      console.log('[AuthWrapper] Profile loaded successfully:', { role: profile.role, email: profile.email });
      setProfileChecked(true);

      setLoadingMessage('Redirecting to your dashboard...');

      const currentPath = location.pathname;
      const isCEOPath = currentPath.startsWith('/ceod');
      const isCTOPath = currentPath.startsWith('/ctod');
      const isSharedPath = currentPath.startsWith('/shared');
      const isRootPath = currentPath === '/' || currentPath === '';
      const isLoginPath = currentPath.startsWith('/login');

      console.log('Route check:', { currentPath, role: profile.role, isCEOPath, isCTOPath, isSharedPath, isRootPath });

      // CEO users should be redirected to CEO dashboard
      if (profile.role === 'ceo') {
        if (isCTOPath || isRootPath || isLoginPath) {
          console.log('Redirecting CEO to /ceod/home from:', currentPath);
          navigate('/ceod/home', { replace: true });
        }
        // Allow CEO to stay on /ceod/* and /shared/* routes
      }
      // CTO/Admin/Staff users should use CTO dashboard
      else {
        if (isCEOPath) {
          console.log(`Redirecting ${profile.role} to /ctod/home from:`, currentPath);
          navigate('/ctod/home', { replace: true });
        } else if (isRootPath || isLoginPath) {
          console.log(`Redirecting ${profile.role} to /ctod/home from root/login`);
          navigate('/ctod/home', { replace: true });
        }
        // Allow access to /ctod/* and /shared/* routes
      }
    } catch (err) {
      console.error('Error checking profile:', err);
      setError('Failed to load profile. Please try again.');
      setProfileChecked(true);
    }
  };

  const handleLoginSuccess = () => {
    console.log('Login success callback triggered');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{loadingMessage}</p>
          <p className="text-slate-400 text-sm mt-2">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg border border-red-200">
          <div className="text-red-600 mb-4 text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setError(null);
                setUser({ id: 'demo-user', email: 'demo@example.com' } as User);
                setProfileChecked(true);
              }}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Continue in Demo Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profileChecked) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
}
