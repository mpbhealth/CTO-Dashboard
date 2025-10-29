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
import { Environment } from './lib/environment';
import React from 'react';

// Startup diagnostics - log initialization steps
console.log('%c[MPB Health Dashboard] Initializing...', 'color: #ec4899; font-weight: bold; font-size: 14px');
console.log('[Init] Environment:', {
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV,
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  timestamp: new Date().toISOString()
});

// Track initialization progress
const initSteps = {
  rootElement: false,
  reactRoot: false,
  rendering: false,
  complete: false
};

window.addEventListener('load', () => {
  console.log('[Init] Window loaded');
  setTimeout(() => {
    if (!initSteps.complete) {
      console.error('[Init] App did not complete initialization within 5 seconds');
      console.error('[Init] Progress:', initSteps);
    }
  }, 5000);
});

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
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Application Error</h1>
          <p className="text-slate-600 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <div className="flex space-x-3 justify-center mb-4">
            <button
              onClick={() => {
                // Clear service worker and caches before reload
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
                window.location.reload();
              }}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Cache & Reload
            </button>
            <button
              onClick={() => {
                setHasError(false);
                setError(null);
                setErrorInfo(null);
              }}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
          <details className="mt-4 text-left">
            <summary className="text-slate-500 cursor-pointer">Technical Details</summary>
            <pre className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-700 overflow-auto">
              {errorInfo || error?.stack || 'No stack trace available'}
            </pre>
            <div className="mt-2 p-2 bg-pink-50 rounded text-xs text-pink-700">
              <strong>Debug Info:</strong><br/>
              • Environment: {import.meta.env.MODE}<br/>
              • Timestamp: {new Date().toISOString()}<br/>
              • User Agent: {navigator.userAgent.substring(0, 50)}...<br/>
              • URL: {window.location.href}
            </div>
          </details>
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

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[Init] CRITICAL: Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found. Check your HTML file.</div>';
} else {
  console.log('[Init] Root element found');
  initSteps.rootElement = true;

  try {
    const root = createRoot(rootElement);
    console.log('[Init] React root created');
    initSteps.reactRoot = true;

    console.log('[Init] Starting render...');
    initSteps.rendering = true;

    root.render(
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

    console.log('[Init] Render initiated');
    setTimeout(() => {
      initSteps.complete = true;
      console.log('%c[Init] ✓ Initialization complete', 'color: #10b981; font-weight: bold');
    }, 100);
  } catch (error) {
    console.error('[Init] CRITICAL: Failed to render React app:', error);
    initSteps.complete = false;
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h2>Critical Error: Failed to initialize application</h2>
        <p>Check the browser console for details.</p>
        <pre>${error}</pre>
      </div>
    `;
  }
}
