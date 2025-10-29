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
      setHasError(true);
      setError(event.error);
      setErrorInfo(event.error?.stack || 'No stack trace available');
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (Environment.isPlatformError(String(event.reason))) {
        return;
      }

      Environment.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setError(new Error(event.reason));
      setErrorInfo(event.reason?.stack || String(event.reason));
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
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
    </ErrorBoundary>
  </StrictMode>
);
