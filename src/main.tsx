import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ProtectedRoute } from './components/guards/ProtectedRoute.tsx';
import { AuthCallback } from './components/pages/AuthCallback.tsx';
import Login from './components/pages/Login.tsx';
import DualDashboardApp from './DualDashboardApp.tsx';
import { PublicDepartmentUploadLanding } from './components/pages/public/PublicDepartmentUploadLanding.tsx';
import { PublicDepartmentUpload } from './components/pages/public/PublicDepartmentUpload.tsx';
import './index.css';
import './lib/diagnostics';
import './lib/whiteScreenDiagnostics';
import { Environment } from './lib/environment';
import { isSupabaseConfigured } from './lib/supabase';
import React from 'react';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (Environment.isPlatformError(event.error || event.message)) {
        return;
      }

      Environment.error('Application error caught:', event.error);
      setTimeout(() => {
        setHasError(true);
        setError(event.error);
        setErrorInfo(event.error?.stack || 'No stack trace available');
      }, 0);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (Environment.isPlatformError(String(event.reason))) {
        return;
      }

      Environment.error('Unhandled promise rejection:', event.reason);
      setTimeout(() => {
        setHasError(true);
        setError(new Error(event.reason));
        setErrorInfo(event.reason?.stack || String(event.reason));
      }, 0);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Error</h1>
            <p className="text-slate-600 mb-4">
              {error?.message || 'An unexpected error occurred'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={() => {
                if (window.clearAllCaches) {
                  window.clearAllCaches();
                } else {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      registrations.forEach(registration => registration.unregister());
                    });
                  }
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => caches.delete(name));
                    });
                  }
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-sm"
            >
              Clear Cache & Reload
            </button>
            <button
              onClick={() => {
                if (window.diagnoseWhiteScreen) {
                  window.diagnoseWhiteScreen();
                }
                alert('Check browser console for diagnostic results');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-sm"
            >
              Run Diagnostics
            </button>
            <button
              onClick={() => {
                setHasError(false);
                setError(null);
                setErrorInfo(null);
              }}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-sm"
            >
              Try Again
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Troubleshooting Tips
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Click "Run Diagnostics" to check what might be causing the issue</li>
              <li>• Open browser console (F12) to see detailed error logs</li>
              <li>• Try "Clear Cache & Reload" to fix loading issues</li>
              <li>• Check if your Supabase connection is working</li>
              <li>• Verify you have an active internet connection</li>
            </ul>
          </div>

          <details className="mt-4 text-left">
            <summary className="text-slate-600 cursor-pointer hover:text-slate-900 font-medium">Technical Details</summary>
            <pre className="mt-3 p-3 bg-slate-100 rounded text-xs text-slate-700 overflow-auto max-h-64">
              {errorInfo || error?.stack || 'No stack trace available'}
            </pre>
            <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded text-xs text-pink-700">
              <strong className="block mb-2">Debug Information:</strong>
              <div className="space-y-1">
                <div>• Environment: {import.meta.env.MODE}</div>
                <div>• Timestamp: {new Date().toISOString()}</div>
                <div>• User Agent: {navigator.userAgent.substring(0, 80)}...</div>
                <div>• URL: {window.location.href}</div>
                <div>• Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing'}</div>
                <div>• Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}</div>
              </div>
            </div>
          </details>

          <div className="mt-6 text-sm text-slate-500">
            Need help? Contact support or check the console for more details.
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

if ('serviceWorker' in navigator && !Environment.isStackBlitz()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        Environment.log('Service Worker registered successfully', registration);
      })
      .catch((registrationError) => {
        Environment.warn('Service Worker registration failed', registrationError);
      });
  });
}

// Configuration Check Component
function ConfigurationCheck({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured && import.meta.env.PROD) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Configuration Required</h1>
                <p className="text-pink-100 mt-1">Database connection not configured</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Action Required</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Your MPB Health Dashboard requires Supabase configuration to function properly.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Setup Instructions</h2>
              <ol className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-semibold text-xs mr-3 mt-0.5">1</span>
                  <span>Log in to your deployment platform (Netlify, Vercel, etc.)</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-semibold text-xs mr-3 mt-0.5">2</span>
                  <span>Navigate to your site's environment variables settings</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-semibold text-xs mr-3 mt-0.5">3</span>
                  <span>Add the following environment variables:</span>
                </li>
              </ol>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 space-y-2">
              <div className="font-mono text-xs">
                <div className="text-slate-400"># Required Variables</div>
                <div className="text-green-400">VITE_SUPABASE_URL</div>
                <div className="text-slate-500 ml-4">Your Supabase project URL</div>
                <div className="text-green-400 mt-2">VITE_SUPABASE_ANON_KEY</div>
                <div className="text-slate-500 ml-4">Your Supabase anonymous key</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Where to find these values
              </h3>
              <ol className="text-xs text-blue-800 space-y-1 ml-6 list-decimal">
                <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">supabase.com/dashboard</a></li>
                <li>Select your project</li>
                <li>Click on "Settings" → "API"</li>
                <li>Copy the "Project URL" and "anon/public" key</li>
              </ol>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-sm"
              >
                I've Added the Variables - Reload Page
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Need help? Contact your system administrator or check the deployment documentation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConfigurationCheck>
        <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider>
            <Routes>
              {/* Login Route */}
              <Route path="/login" element={<Login onLoginSuccess={() => {}} />} />

              {/* Auth Callback Route */}
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Public Department Upload Routes - No Auth Required */}
              <Route path="/public/upload" element={<PublicDepartmentUploadLanding />} />
              <Route path="/public/upload/:department" element={<PublicDepartmentUpload />} />

              {/* All Dashboard Routes - Handles /ceod, /ctod, /shared, and legacy routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DualDashboardApp />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
      </ConfigurationCheck>
    </ErrorBoundary>
  </StrictMode>
);
