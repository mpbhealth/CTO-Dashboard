import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [loadingMessage, setLoadingMessage] = useState('Checking authentication...');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('[AuthWrapper] Supabase not configured - running in demo mode');
      return;
    }

    if (authLoading) {
      setLoadingMessage('Checking authentication...');
      return;
    }

    if (user && !profile) {
      setLoadingMessage('Loading your profile...');
      return;
    }

    if (user && profile) {
      setLoadingMessage('Redirecting to your dashboard...');

      const currentPath = location.pathname;
      const isCEOPath = currentPath.startsWith('/ceod');
      const isCTOPath = currentPath.startsWith('/ctod');
      const isSharedPath = currentPath.startsWith('/shared');
      const isRootPath = currentPath === '/' || currentPath === '';
      const isLoginPath = currentPath.startsWith('/login');

      console.log('[AuthWrapper] Route check:', { currentPath, role: profile.role, isCEOPath, isCTOPath, isSharedPath, isRootPath });

      if (profile.role === 'ceo') {
        if (isCTOPath || isRootPath || isLoginPath) {
          console.log('[AuthWrapper] Redirecting CEO to /ceod/home from:', currentPath);
          navigate('/ceod/home', { replace: true });
        }
      } else {
        if (isCEOPath) {
          console.log(`[AuthWrapper] Redirecting ${profile.role} to /ctod/home from:`, currentPath);
          navigate('/ctod/home', { replace: true });
        } else if (isRootPath || isLoginPath) {
          console.log(`[AuthWrapper] Redirecting ${profile.role} to /ctod/home from root/login`);
          navigate('/ctod/home', { replace: true });
        }
      }
    }
  }, [user, profile, authLoading, location.pathname, navigate]);

  if (authLoading) {
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
                window.location.reload();
              }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => console.log('[AuthWrapper] Login success')} />;
  }

  return <>{children}</>;
}
