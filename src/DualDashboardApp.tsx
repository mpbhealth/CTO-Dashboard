import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthWrapper from './components/pages/AuthWrapper';
import { useRoleBasedRedirect } from './hooks/useDualDashboard';

const CTOHome = lazy(() => import('./components/pages/ctod/CTOHome').then(m => ({ default: m.CTOHome })));
const CEOHome = lazy(() => import('./components/pages/ceod/CEOHome').then(m => ({ default: m.CEOHome })));
const CEOMarketingDashboard = lazy(() => import('./components/pages/ceod/CEOMarketingDashboard').then(m => ({ default: m.CEOMarketingDashboard })));
const SharedOverview = lazy(() => import('./components/pages/shared/SharedOverview').then(m => ({ default: m.SharedOverview })));
const AuditLogViewer = lazy(() => import('./components/pages/shared/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      refetchOnWindowFocus: false,
    },
  },
});

function RoleBasedRedirect() {
  const { redirectPath, isLoading } = useRoleBasedRedirect();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Navigate to="/ctod/home" replace />;
}

function DualDashboardApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthWrapper>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<RoleBasedRedirect />} />

              <Route path="/ctod/home" element={<CTOHome />} />
              <Route path="/ctod/files" element={<CTOHome />} />
              <Route path="/ctod/kpis" element={<CTOHome />} />
              <Route path="/ctod/engineering" element={<CTOHome />} />
              <Route path="/ctod/compliance" element={<CTOHome />} />

              <Route path="/ceod/home" element={<CEOHome />} />
              <Route path="/ceod/marketing" element={<CEOMarketingDashboard />} />
              <Route path="/ceod/files" element={<CEOHome />} />
              <Route path="/ceod/board" element={<CEOHome />} />
              <Route path="/ceod/initiatives" element={<CEOHome />} />
              <Route path="/ceod/approvals" element={<CEOHome />} />

              <Route path="/shared/overview" element={<SharedOverview />} />
              <Route path="/shared/audit" element={<AuditLogViewer />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default DualDashboardApp;
