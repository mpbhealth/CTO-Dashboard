import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRoleBasedRedirect } from './hooks/useDualDashboard';
import { CEOOnly, CTOOnly } from './components/guards/RoleGuard';

const CTOHome = lazy(() => import('./components/pages/ctod/CTOHome').then(m => ({ default: m.CTOHome })));
const CEOHome = lazy(() => import('./components/pages/ceod/CEOHome').then(m => ({ default: m.CEOHome })));
const CEOMarketingDashboard = lazy(() => import('./components/pages/ceod/CEOMarketingDashboard').then(m => ({ default: m.CEOMarketingDashboard })));
const CEOMarketingPlanner = lazy(() => import('./components/pages/ceod/CEOMarketingPlanner').then(m => ({ default: m.CEOMarketingPlanner })));
const CEOContentCalendar = lazy(() => import('./components/pages/ceod/CEOContentCalendar').then(m => ({ default: m.CEOContentCalendar })));
const CEOMarketingBudget = lazy(() => import('./components/pages/ceod/CEOMarketingBudget').then(m => ({ default: m.CEOMarketingBudget })));
const CEOBoardPacket = lazy(() => import('./components/pages/ceod/CEOBoardPacket').then(m => ({ default: m.CEOBoardPacket })));
const CEOConciergeTracking = lazy(() => import('./components/pages/ceod/CEOConciergeTracking').then(m => ({ default: m.CEOConciergeTracking })));
const CEOConciergeNotes = lazy(() => import('./components/pages/ceod/CEOConciergeNotes').then(m => ({ default: m.CEOConciergeNotes })));
const CEOSalesReports = lazy(() => import('./components/pages/ceod/CEOSalesReports').then(m => ({ default: m.CEOSalesReports })));
const CEOOperations = lazy(() => import('./components/pages/ceod/CEOOperations').then(m => ({ default: m.CEOOperations })));
const CEOFiles = lazy(() => import('./components/pages/ceod/CEOFiles').then(m => ({ default: m.CEOFiles })));
const CEODataManagement = lazy(() => import('./components/pages/ceod/CEODataManagement').then(m => ({ default: m.CEODataManagement })));
const SharedOverview = lazy(() => import('./components/pages/shared/SharedOverview').then(m => ({ default: m.SharedOverview })));
const AuditLogViewer = lazy(() => import('./components/pages/shared/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const AuthDiagnostics = lazy(() => import('./components/pages/AuthDiagnostics'));

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
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/ctod/home" element={<CTOOnly><CTOHome /></CTOOnly>} />
          <Route path="/ctod/files" element={<CTOOnly><CTOHome /></CTOOnly>} />
          <Route path="/ctod/kpis" element={<CTOOnly><CTOHome /></CTOOnly>} />
          <Route path="/ctod/engineering" element={<CTOOnly><CTOHome /></CTOOnly>} />
          <Route path="/ctod/compliance" element={<CTOOnly><CTOHome /></CTOOnly>} />

          <Route path="/ceod/home" element={<CEOOnly><CEOHome /></CEOOnly>} />
          <Route path="/ceod/marketing" element={<CEOOnly><CEOMarketingDashboard /></CEOOnly>} />
          <Route path="/ceod/marketing/planner" element={<CEOOnly><CEOMarketingPlanner /></CEOOnly>} />
          <Route path="/ceod/marketing/calendar" element={<CEOOnly><CEOContentCalendar /></CEOOnly>} />
          <Route path="/ceod/marketing/budget" element={<CEOOnly><CEOMarketingBudget /></CEOOnly>} />
          <Route path="/ceod/concierge/tracking" element={<CEOOnly><CEOConciergeTracking /></CEOOnly>} />
          <Route path="/ceod/concierge/notes" element={<CEOOnly><CEOConciergeNotes /></CEOOnly>} />
          <Route path="/ceod/sales/reports" element={<CEOOnly><CEOSalesReports /></CEOOnly>} />
          <Route path="/ceod/operations/overview" element={<CEOOnly><CEOOperations /></CEOOnly>} />
          <Route path="/ceod/files" element={<CEOOnly><CEOFiles /></CEOOnly>} />
          <Route path="/ceod/data" element={<CEOOnly><CEODataManagement /></CEOOnly>} />
          <Route path="/ceod/board" element={<CEOOnly><CEOBoardPacket /></CEOOnly>} />
          <Route path="/ceod/initiatives" element={<CEOOnly><CEOHome /></CEOOnly>} />
          <Route path="/ceod/approvals" element={<CEOOnly><CEOHome /></CEOOnly>} />

          <Route path="/shared/overview" element={<SharedOverview />} />
          <Route path="/shared/audit" element={<AuditLogViewer />} />
          <Route path="/diagnostics" element={<AuthDiagnostics />} />

          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </Suspense>
    </QueryClientProvider>
  );
}

export default DualDashboardApp;
