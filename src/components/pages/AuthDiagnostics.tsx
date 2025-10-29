import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthDiagnostics() {
  const { user, profile, loading, isDemoMode } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    setDiagnostics({
      timestamp: new Date().toISOString(),
      environment: {
        mode: import.meta.env.MODE,
        supabaseConfigured: isSupabaseConfigured,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        demoMode: isDemoMode,
      },
      auth: {
        loading,
        hasUser: !!user,
        userId: user?.id || 'None',
        userEmail: user?.email || 'None',
        hasProfile: !!profile,
        profileRole: profile?.role || 'None',
        isDemoMode,
      },
      cookies: {
        role: getCookie('role') || 'None',
        displayName: getCookie('display_name') || 'None',
      },
      storage: {
        localStorageKeys: Object.keys(localStorage),
        sessionStorageKeys: Object.keys(sessionStorage),
        demoModeKey: localStorage.getItem('mpb_demo_mode') || 'Not Set',
        demoRoleKey: localStorage.getItem('mpb_demo_role') || 'Not Set',
      },
      browser: {
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      },
    });
  }, [user, profile, loading, isDemoMode]);

  const runDiagnosticTests = async () => {
    setIsRunningTests(true);
    const results: any = {};

    try {
      results.sessionCheck = await testSessionCheck();
      results.profileQuery = await testProfileQuery();
      results.rlsPolicies = await testRLSPolicies();
      results.connectivity = await testConnectivity();
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const testSessionCheck = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      return {
        success: !error,
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        error: error?.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const testProfileQuery = async () => {
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      return {
        success: !error,
        hasProfile: !!data,
        profileData: data,
        error: error?.message,
        errorDetails: error ? {
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        } : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const testRLSPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      return {
        success: !error,
        canQuery: !error,
        error: error?.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const testConnectivity = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.com', {
        method: 'HEAD',
      });
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const clearAllAuthData = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {isDemoMode && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">Demo Mode Active</h2>
                <p className="text-white/90">You are viewing the dashboard in demo mode as <span className="font-semibold uppercase">{profile?.role || 'unknown'}</span>. This is a simulated session without Supabase authentication.</p>
                <p className="text-sm mt-2 text-white/80">To switch roles, use: <code className="bg-white/20 px-2 py-1 rounded">?demo_role=ceo</code> or <code className="bg-white/20 px-2 py-1 rounded">?demo_role=cto</code></p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Authentication Diagnostics</h1>
          <p className="text-slate-600">Comprehensive debugging information for authentication issues</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Environment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Mode:</span>
                <span className="font-mono text-slate-900">{diagnostics.environment?.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Supabase Configured:</span>
                <span className={`font-semibold ${diagnostics.environment?.supabaseConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnostics.environment?.supabaseConfigured ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Supabase URL:</span>
                <span className="font-mono text-slate-900">{diagnostics.environment?.supabaseUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Supabase Key:</span>
                <span className="font-mono text-slate-900">{diagnostics.environment?.supabaseKey}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Authentication State</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Loading:</span>
                <span className={`font-semibold ${diagnostics.auth?.loading ? 'text-amber-600' : 'text-green-600'}`}>
                  {diagnostics.auth?.loading ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">User Authenticated:</span>
                <span className={`font-semibold ${diagnostics.auth?.hasUser ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnostics.auth?.hasUser ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">User ID:</span>
                <span className="font-mono text-slate-900 text-xs">{diagnostics.auth?.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Email:</span>
                <span className="font-mono text-slate-900">{diagnostics.auth?.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Profile Loaded:</span>
                <span className={`font-semibold ${diagnostics.auth?.hasProfile ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnostics.auth?.hasProfile ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Profile Role:</span>
                <span className="font-mono text-slate-900">{diagnostics.auth?.profileRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Context Role:</span>
                <span className="font-mono text-slate-900">{diagnostics.auth?.contextRole}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Cookies</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Role Cookie:</span>
                <span className="font-mono text-slate-900">{diagnostics.cookies?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Display Name:</span>
                <span className="font-mono text-slate-900">{diagnostics.cookies?.displayName}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Browser</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Cookies Enabled:</span>
                <span className={`font-semibold ${diagnostics.browser?.cookiesEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnostics.browser?.cookiesEnabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Online:</span>
                <span className={`font-semibold ${diagnostics.browser?.onLine ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnostics.browser?.onLine ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Diagnostic Tests</h2>
          <button
            onClick={runDiagnosticTests}
            disabled={isRunningTests}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {isRunningTests ? 'Running Tests...' : 'Run Diagnostic Tests'}
          </button>

          {Object.keys(testResults).length > 0 && (
            <div className="mt-6 space-y-4">
              {Object.entries(testResults).map(([key, result]: [string, any]) => (
                <div key={key} className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  <pre className="text-xs bg-slate-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Reload Page
            </button>
            <button
              onClick={clearAllAuthData}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Clear All Auth Data & Restart
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-pink-50 rounded-lg">
          <p className="text-sm text-pink-700">
            <strong>Note:</strong> This page is for debugging authentication issues.
            If you see "Profile Loaded: No" but "User Authenticated: Yes", there may be a database RLS policy issue or missing profile record.
          </p>
        </div>
      </div>
    </div>
  );
}
