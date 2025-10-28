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

// Enhanced Error boundary to catch and display any startup errors
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Application error caught:', event.error);
      setHasError(true);
      setError(event.error);
      setErrorInfo(event.error?.stack || 'No stack trace available');
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
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

  // Note: React 18 function components cannot implement componentDidCatch.

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

// Service Worker Registration for PWA
// Skip SW registration on StackBlitz since it's not supported
const isStackBlitz = window.location.hostname.includes('stackblitz') ||
                     window.location.hostname.includes('webcontainer');

if ('serviceWorker' in navigator && !isStackBlitz) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
} else if (isStackBlitz) {
  console.log('Service Worker registration skipped: running on StackBlitz/WebContainer');
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
