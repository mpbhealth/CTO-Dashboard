import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import Login from './Login';
import { User } from '@supabase/supabase-js';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Suppress console warnings from third-party extensions
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    console.warn = (...args) => {
      const message = args.join(' ').toLowerCase();
      if (message.includes('keplr') || message.includes('wallet') || message.includes('extension')) {
        return; // Suppress wallet extension warnings
      }
      originalConsoleWarn.apply(console, args);
    };
    
    console.error = (...args) => {
      const message = args.join(' ').toLowerCase();
      if (message.includes('keplr') || message.includes('injectedscript') || message.includes('getofflinesigner')) {
        return; // Suppress wallet extension errors
      }
      originalConsoleError.apply(console, args);
    };

    // If Supabase is not configured, skip auth and show demo mode
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - running in demo mode');
      setUser({ id: 'demo-user', email: 'demo@example.com' } as User);
      setLoading(false);
      
      // Restore original console methods
      return () => {
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
      };
      return;
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Auth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        // In case of auth error, continue in demo mode
        setUser({ id: 'demo-user', email: 'demo@example.com' } as User);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setUser(session?.user ?? null);
        } catch (err) {
          console.error('Auth state change error:', err);
          setUser({ id: 'demo-user', email: 'demo@example.com' } as User);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    // The auth state change listener will handle updating the user state
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state but allow demo mode access
  if (error && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 mb-4">⚠️ Authentication Error</div>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setUser({ id: 'demo-user', email: 'demo@example.com' } as User);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Continue in Demo Mode
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
}