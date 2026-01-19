import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AUTH_TIMEOUT_MS = 15000;
const PROFILE_TIMEOUT_MS = 10000;

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [loadingMessage, setLoadingMessage] = useState('Checking authentication...');
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('[AuthWrapper] Supabase not configured - running in demo mode');
      setTimedOut(false);
      return;
    }

    if (authLoading) {
      setLoadingMessage('Checking authentication...');
      setTimedOut(false);

      if (!authTimeoutRef.current) {
        authTimeoutRef.current = setTimeout(() => {
          console.error('[AuthWrapper] Auth loading timeout exceeded');
          setTimedOut(true);
          setError('Authentication check is taking too long. Please refresh the page or check your connection.');
        }, AUTH_TIMEOUT_MS);
      }
      return;
    } else {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
    }

    if (user && !profile) {
      setLoadingMessage('Loading your profile...');

      if (!profileTimeoutRef.current) {
        profileTimeoutRef.current = setTimeout(() => {
          console.error('[AuthWrapper] Profile loading timeout exceeded');
          setTimedOut(true);
          setError('Profile loading is taking too long. This may indicate a database permission issue. Please try signing out and back in.');
        }, PROFILE_TIMEOUT_MS);
      }
      return;
    } else {
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current);
        profileTimeoutRef.current = null;
      }
    }

    if (user && profile && !redirectAttemptedRef.current) {
      setLoadingMessage('Redirecting to your dashboard...');
      redirectAttemptedRef.current = true;

      const currentPath = location.pathname;
      const isCEOPath = currentPath.startsWith('/ceod');
      const isCTOPath = currentPath.startsWith('/ctod');
      const _isSharedPath = currentPath.startsWith('/shared');
      const isRootPath = currentPath === '/' || currentPath === '';
      const isLoginPath = currentPath.startsWith('/login');
      const isAuthCallbackPath = currentPath.startsWith('/auth/callback');

      if (profile.role === 'ceo') {
        if (isCTOPath || isRootPath || isLoginPath || isAuthCallbackPath) {
          setTimeout(() => {
            navigate('/ceod/home', { replace: true });
            redirectAttemptedRef.current = false;
          }, 100);
        } else {
          redirectAttemptedRef.current = false;
        }
      } else {
        if (isCEOPath) {
          setTimeout(() => {
            navigate('/ctod/home', { replace: true });
            redirectAttemptedRef.current = false;
          }, 100);
        } else if (isRootPath || isLoginPath || isAuthCallbackPath) {
          setTimeout(() => {
            navigate('/ctod/home', { replace: true });
            redirectAttemptedRef.current = false;
          }, 100);
        } else {
          redirectAttemptedRef.current = false;
        }
      }
    }

    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current);
        profileTimeoutRef.current = null;
      }
    };
  }, [user, profile, authLoading, location.pathname, navigate]);

  if (authLoading && !timedOut) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium text-lg">{loadingMessage}</p>
          <p className="text-slate-400 text-sm mt-2">Please wait...</p>
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg text-left">
            <p className="text-xs text-indigo-700 mb-2">If loading takes too long:</p>
            <ul className="text-xs text-indigo-600 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Verify Supabase configuration</li>
              <li>• Clear browser cache and try again</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg border border-amber-200">
          <div className="text-amber-600 mb-4 text-4xl">⏱️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Timeout</h2>
          <p className="text-slate-600 mb-6">{error || 'Authentication is taking longer than expected.'}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setTimedOut(false);
                setError(null);
                redirectAttemptedRef.current = false;
                window.location.reload();
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Reload and Try Again
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                document.cookie.split(';').forEach(c => {
                  document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                });
                window.location.href = '/';
              }}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Clear All Data & Restart
            </button>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg text-left">
            <p className="text-xs text-slate-600 font-semibold mb-2">Debug Information:</p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>• User authenticated: {user ? 'Yes' : 'No'}</p>
              <p>• Profile loaded: {profile ? 'Yes' : 'No'}</p>
              <p>• Current path: {location.pathname}</p>
              <p>• Supabase configured: {isSupabaseConfigured ? 'Yes' : 'No'}</p>
            </div>
          </div>
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
                window.location.reload();
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return <>{children}</>;
}
