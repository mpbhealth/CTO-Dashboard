import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { useRoleBasedRedirect } from './hooks/useDualDashboard';
import { CEOOnly, CTOOnly } from './components/guards/RoleGuard';
import { CEOErrorBoundary } from './components/ceo/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import { CEODashboardLayout } from './components/layouts/CEODashboardLayout';
import Sidebar from './components/Sidebar';

const CTOHome = lazy(() => import('./components/pages/ctod/CTOHome').then(m => ({ default: m.CTOHome })));
const CTOOperations = lazy(() => import('./components/pages/ctod/CTOOperations').then(m => ({ default: m.CTOOperations })));
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
const CEOFinance = lazy(() => import('./components/pages/ceod/CEOFinance').then(m => ({ default: m.CEOFinance })));
const CEODepartmentUpload = lazy(() => import('./components/pages/ceod/CEODepartmentUpload').then(m => ({ default: m.CEODepartmentUpload })));
const CEODepartmentUploadPortal = lazy(() => import('./components/pages/ceod/CEODepartmentUploadPortal').then(m => ({ default: m.CEODepartmentUploadPortal })));
const CEOConciergeTrackingReports = lazy(() => import('./components/pages/ceod/CEOConciergeTrackingReports').then(m => ({ default: m.CEOConciergeTrackingReports })));
const CEOFinanceSnapshot = lazy(() => import('./components/pages/ceod/CEOFinanceSnapshot').then(m => ({ default: m.CEOFinanceSnapshot })));
const CEOOperationsDashboard = lazy(() => import('./components/pages/ceod/CEOOperationsDashboard').then(m => ({ default: m.CEOOperationsDashboard })));
const CEOOperationsTrackingReports = lazy(() => import('./components/pages/ceod/CEOOperationsTrackingReports').then(m => ({ default: m.CEOOperationsTrackingReports })));
const CEOSaudeMAXReports = lazy(() => import('./components/pages/ceod/CEOSaudeMAXReports').then(m => ({ default: m.CEOSaudeMAXReports })));
const CEODepartmentConcierge = lazy(() => import('./components/pages/ceod/CEODepartmentConcierge').then(m => ({ default: m.CEODepartmentConcierge })));
const CEODepartmentSales = lazy(() => import('./components/pages/ceod/CEODepartmentSales').then(m => ({ default: m.CEODepartmentSales })));
const CEODepartmentOperations = lazy(() => import('./components/pages/ceod/CEODepartmentOperations').then(m => ({ default: m.CEODepartmentOperations })));
const CEODepartmentFinance = lazy(() => import('./components/pages/ceod/CEODepartmentFinance').then(m => ({ default: m.CEODepartmentFinance })));
const CEODepartmentSaudeMAX = lazy(() => import('./components/pages/ceod/CEODepartmentSaudeMAX').then(m => ({ default: m.CEODepartmentSaudeMAX })));
const SharedOverview = lazy(() => import('./components/pages/shared/SharedOverview').then(m => ({ default: m.SharedOverview })));
const AuditLogViewer = lazy(() => import('./components/pages/shared/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const AuthDiagnostics = lazy(() => import('./components/pages/AuthDiagnostics'));

const Overview = lazy(() => import('./components/pages/Overview'));
const TechStack = lazy(() => import('./components/pages/TechStack'));
const QuickLinks = lazy(() => import('./components/pages/QuickLinks'));
const Roadmap = lazy(() => import('./components/pages/Roadmap'));
const RoadmapPresentation = lazy(() => import('./components/pages/RoadmapPresentation'));
const RoadVisualizerWithFilters = lazy(() => import('./components/pages/RoadVisualizerWithFilters'));
const Projects = lazy(() => import('./components/pages/Projects'));
const MondayTasks = lazy(() => import('./components/pages/MondayTasks'));
const Assignments = lazy(() => import('./components/pages/Assignments'));
const Notepad = lazy(() => import('./components/pages/Notepad'));

// Operations & Management pages
const SaaSSpend = lazy(() => import('./components/pages/SaaSSpend'));
const AIAgents = lazy(() => import('./components/pages/AIAgents'));
const ITSupport = lazy(() => import('./components/pages/ITSupport'));
const IntegrationsHub = lazy(() => import('./components/pages/IntegrationsHub'));
const PolicyManagement = lazy(() => import('./components/pages/PolicyManagement'));
const EmployeePerformance = lazy(() => import('./components/pages/EmployeePerformance'));
const PerformanceEvaluation = lazy(() => import('./components/pages/PerformanceEvaluation'));
const OrganizationalStructure = lazy(() => import('./components/pages/OrganizationalStructure'));
const Deployments = lazy(() => import('./components/pages/Deployments'));
const APIStatus = lazy(() => import('./components/pages/APIStatus'));
const SystemUptime = lazy(() => import('./components/pages/SystemUptime'));

// Compliance pages
const ComplianceCommandCenter = lazy(() => import('./components/pages/ComplianceCommandCenter'));
const ComplianceAdministration = lazy(() => import('./components/pages/ComplianceAdministration'));
const ComplianceTraining = lazy(() => import('./components/pages/ComplianceTraining'));
const CompliancePHIAccess = lazy(() => import('./components/pages/CompliancePHIAccess'));
const ComplianceTechnicalSafeguards = lazy(() => import('./components/pages/ComplianceTechnicalSafeguards'));
const ComplianceBAAs = lazy(() => import('./components/pages/ComplianceBAAs'));
const ComplianceIncidents = lazy(() => import('./components/pages/ComplianceIncidents'));
const ComplianceAudits = lazy(() => import('./components/pages/ComplianceAudits'));
const ComplianceTemplatesTools = lazy(() => import('./components/pages/ComplianceTemplatesTools'));
const EmployeeDocumentStorage = lazy(() => import('./components/pages/EmployeeDocumentStorage'));

// Analytics pages
const Analytics = lazy(() => import('./components/pages/Analytics'));
const MemberEngagement = lazy(() => import('./components/pages/MemberEngagement'));
const MemberRetention = lazy(() => import('./components/pages/MemberRetention'));
const AdvisorPerformance = lazy(() => import('./components/pages/AdvisorPerformance'));
const MarketingAnalytics = lazy(() => import('./components/pages/MarketingAnalytics'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      // Keep previous data during refetches to prevent flickering
      placeholderData: (previousData: unknown) => previousData,
    },
  },
});

function RoleBasedRedirect() {
  const { redirectPath, isLoading } = useRoleBasedRedirect();
  const { profile } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  const defaultPath = profile?.role === 'ceo' ? '/ceod/home' : '/ctod/home';
  return <Navigate to={defaultPath} replace />;
}

const routeToTabMap: Record<string, string> = {
  '/ctod/home': 'overview',
  '/ctod/files': 'overview',
  '/ctod/kpis': 'overview',
  '/ctod/engineering': 'tech-stack',
  '/ctod/compliance': 'compliance',
  '/ceod/data': 'department-reporting',
  '/ceod/departments/concierge': 'department-reporting/concierge',
  '/ceod/departments/sales': 'department-reporting/sales',
  '/ceod/departments/operations': 'department-reporting/operations',
  '/ceod/departments/finance': 'department-reporting/finance',
  '/ceod/departments/saudemax': 'department-reporting/saudemax',
  '/ctod/compliance/dashboard': 'compliance',
  '/ctod/compliance/administration': 'compliance',
  '/ctod/compliance/training': 'compliance',
  '/ctod/compliance/phi-minimum': 'compliance',
  '/ctod/compliance/technical-safeguards': 'compliance',
  '/ctod/compliance/baas': 'compliance',
  '/ctod/compliance/incidents': 'compliance',
  '/ctod/compliance/audits': 'compliance',
  '/ctod/compliance/templates-tools': 'compliance',
  '/ctod/compliance/employee-documents': 'compliance',
  '/ceod/home': 'overview',
  '/ceod/analytics': 'analytics',
  '/ceod/analytics/overview': 'analytics',
  '/ceod/analytics/member-engagement': 'member-engagement',
  '/ceod/analytics/member-retention': 'member-retention',
  '/ceod/analytics/advisor-performance': 'advisor-performance',
  '/ceod/analytics/marketing': 'marketing-analytics',
  '/ceod/marketing': 'marketing-analytics',
  '/ceod/marketing/planner': 'marketing-analytics',
  '/ceod/marketing/calendar': 'marketing-analytics',
  '/ceod/marketing/budget': 'marketing-analytics',
  '/ceod/concierge/tracking': 'overview',
  '/ceod/concierge/notes': 'overview',
  '/ceod/sales/reports': 'overview',
  '/ceod/operations/overview': 'overview',
  '/ceod/files': 'overview',
  '/ceod/board': 'overview',
  '/ceod/initiatives': 'overview',
  '/ceod/approvals': 'overview',
  '/shared/overview': 'overview',
  '/shared/audit': 'overview',
  '/shared/saas': 'saas',
  '/shared/ai-agents': 'ai-agents',
  '/shared/it-support': 'it-support',
  '/shared/integrations': 'integrations',
  '/shared/deployments': 'deployments',
  '/shared/policy-management': 'policy-management',
  '/shared/employee-performance': 'employee-performance',
  '/shared/api-status': 'api-status',
  '/shared/system-uptime': 'system-uptime',
  '/shared/performance-evaluation': 'performance-evaluation',
  '/shared/organizational-structure': 'organizational-structure',
  '/diagnostics': 'overview',
  '/tech-stack': 'tech-stack',
  '/quick-links': 'quick-links',
  '/roadmap': 'roadmap',
  '/road-visualizer': 'road-visualizer',
  '/roadmap-presentation': 'roadmap-presentation',
  '/projects': 'projects',
  '/monday-tasks': 'monday-tasks',
  '/assignments': 'assignments',
  '/notepad': 'notepad',
};

const tabToRouteMap: Record<string, string> = {
  'overview': '/ctod/home',
  'analytics': '/ceod/analytics/overview',
  'member-engagement': '/ceod/analytics/member-engagement',
  'member-retention': '/ceod/analytics/member-retention',
  'advisor-performance': '/ceod/analytics/advisor-performance',
  'marketing-analytics': '/ceod/analytics/marketing',
  'department-reporting': '/ceod/data',
  'department-reporting/concierge': '/ceod/departments/concierge',
  'department-reporting/sales': '/ceod/departments/sales',
  'department-reporting/operations': '/ceod/departments/operations',
  'department-reporting/finance': '/ceod/departments/finance',
  'department-reporting/saudemax': '/ceod/departments/saudemax',
  'tech-stack': '/tech-stack',
  'quick-links': '/quick-links',
  'roadmap': '/roadmap',
  'road-visualizer': '/road-visualizer',
  'roadmap-presentation': '/roadmap-presentation',
  'projects': '/projects',
  'monday-tasks': '/monday-tasks',
  'assignments': '/assignments',
  'notepad': '/notepad',
  'compliance': '/ctod/compliance/dashboard',
  'compliance/command-center': '/ctod/compliance/dashboard',
  'compliance/administration': '/ctod/compliance/administration',
  'compliance/training': '/ctod/compliance/training',
  'compliance/phi-minimum': '/ctod/compliance/phi-minimum',
  'compliance/technical-safeguards': '/ctod/compliance/technical-safeguards',
  'compliance/baas': '/ctod/compliance/baas',
  'compliance/incidents': '/ctod/compliance/incidents',
  'compliance/audits': '/ctod/compliance/audits',
  'compliance/templates-tools': '/ctod/compliance/templates-tools',
  'compliance/employee-documents': '/ctod/compliance/employee-documents',
  'saas': '/shared/saas',
  'ai-agents': '/shared/ai-agents',
  'it-support': '/shared/it-support',
  'integrations': '/shared/integrations',
  'deployments': '/shared/deployments',
  'policy-management': '/shared/policy-management',
  'employee-performance': '/shared/employee-performance',
  'api-status': '/shared/api-status',
  'system-uptime': '/shared/system-uptime',
  'performance-evaluation': '/shared/performance-evaluation',
  'organizational-structure': '/shared/organizational-structure',
};

function DualDashboardContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, profileReady, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const isCEORoute = useMemo(() => location.pathname.startsWith('/ceod/'), [location.pathname]);

  const shouldShowCTOSidebar = useMemo(() => {
    return profileReady && !isCEORoute;
  }, [profileReady, isCEORoute]);

  useEffect(() => {
    function checkIfMobile() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarExpanded(false);
      }
    }

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (!profileReady || isCEORoute) {
      return;
    }

    const currentPath = location.pathname;
    const matchedTab = routeToTabMap[currentPath];
    if (matchedTab) {
      setActiveTab(matchedTab);
    } else {
      for (const [route, tab] of Object.entries(routeToTabMap)) {
        if (currentPath.startsWith(route)) {
          setActiveTab(tab);
          break;
        }
      }
    }
  }, [location.pathname, isCEORoute, profileReady]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    const route = tabToRouteMap[tab];
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!profileReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      {shouldShowCTOSidebar && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isSidebarExpanded={isSidebarExpanded}
          onSidebarToggle={toggleSidebar}
        />
      )}

      {shouldShowCTOSidebar && isMobile && !isSidebarExpanded && (
        <button
          className="fixed top-4 left-4 p-3 rounded-md bg-pink-600 text-white shadow-lg md:hidden z-50 mobile-hamburger"
          onClick={toggleSidebar}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <main className={`flex-1 overflow-y-auto ${
        isCEORoute
          ? ''
          : `transition-all duration-300 ${isMobile ? 'p-3' : 'p-8 pl-12'} ${isSidebarExpanded ? 'md:pl-96' : isMobile ? 'ml-0 pt-16' : 'md:pl-32'}`
      }`}>
        <CEOErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            <Route path="/ctod/home" element={<CTOOnly><CTOHome /></CTOOnly>} />
            <Route path="/ctod/files" element={<CTOOnly><CTOHome /></CTOOnly>} />
            <Route path="/ctod/kpis" element={<CTOOnly><CTOHome /></CTOOnly>} />
            <Route path="/ctod/engineering" element={<CTOOnly><CTOHome /></CTOOnly>} />
            <Route path="/ctod/compliance" element={<CTOOnly><ComplianceCommandCenter /></CTOOnly>} />
            <Route path="/ctod/compliance/dashboard" element={<CTOOnly><ComplianceCommandCenter /></CTOOnly>} />
            <Route path="/ctod/compliance/administration" element={<CTOOnly><ComplianceAdministration /></CTOOnly>} />
            <Route path="/ctod/compliance/training" element={<CTOOnly><ComplianceTraining /></CTOOnly>} />
            <Route path="/ctod/compliance/phi-minimum" element={<CTOOnly><CompliancePHIAccess /></CTOOnly>} />
            <Route path="/ctod/compliance/technical-safeguards" element={<CTOOnly><ComplianceTechnicalSafeguards /></CTOOnly>} />
            <Route path="/ctod/compliance/baas" element={<CTOOnly><ComplianceBAAs /></CTOOnly>} />
            <Route path="/ctod/compliance/incidents" element={<CTOOnly><ComplianceIncidents /></CTOOnly>} />
            <Route path="/ctod/compliance/audits" element={<CTOOnly><ComplianceAudits /></CTOOnly>} />
            <Route path="/ctod/compliance/templates-tools" element={<CTOOnly><ComplianceTemplatesTools /></CTOOnly>} />
            <Route path="/ctod/compliance/employee-documents" element={<CTOOnly><EmployeeDocumentStorage /></CTOOnly>} />
            <Route path="/ctod/operations" element={<CTOOnly><CTOOperations /></CTOOnly>} />

            <Route path="/ceod/home" element={<CEOOnly><CEODashboardLayout><CEOHome /></CEODashboardLayout></CEOOnly>} />

            {/* CEO Analytics Routes */}
            <Route path="/ceod/analytics" element={<CEOOnly><CEODashboardLayout><Analytics /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/overview" element={<CEOOnly><CEODashboardLayout><Analytics /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/member-engagement" element={<CEOOnly><CEODashboardLayout><MemberEngagement /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/member-retention" element={<CEOOnly><CEODashboardLayout><MemberRetention /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/advisor-performance" element={<CEOOnly><CEODashboardLayout><AdvisorPerformance /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/marketing" element={<CEOOnly><CEODashboardLayout><MarketingAnalytics /></CEODashboardLayout></CEOOnly>} />

            <Route path="/ceod/marketing" element={<CEOOnly><CEODashboardLayout><CEOMarketingDashboard /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/marketing/planner" element={<CEOOnly><CEODashboardLayout><CEOMarketingPlanner /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/marketing/calendar" element={<CEOOnly><CEODashboardLayout><CEOContentCalendar /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/marketing/budget" element={<CEOOnly><CEODashboardLayout><CEOMarketingBudget /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/concierge/tracking" element={<CEOOnly><CEODashboardLayout><CEOConciergeTrackingReports /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/concierge/notes" element={<CEOOnly><CEODashboardLayout><CEOConciergeNotes /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/sales/reports" element={<CEOOnly><CEODashboardLayout><CEOSalesReports /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/overview" element={<CEOOnly><CEODashboardLayout><CEOOperationsDashboard /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/tracking" element={<CEOOnly><CEODashboardLayout><CEOOperationsTrackingReports /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/finance" element={<CEOOnly><CEODashboardLayout><CEOFinanceSnapshot /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/finance/overview" element={<CEOOnly><CEODashboardLayout><CEOFinanceSnapshot /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/saudemax/reports" element={<CEOOnly><CEODashboardLayout><CEOSaudeMAXReports /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/upload-portal" element={<CEODashboardLayout><CEODepartmentUploadPortal /></CEODashboardLayout>} />
            <Route path="/ceod/upload" element={<CEODashboardLayout><CEODepartmentUpload /></CEODashboardLayout>} />
            <Route path="/ceod/files" element={<CEOOnly><CEODashboardLayout><CEOFiles /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/data" element={<CEOOnly><CEODashboardLayout><CEODataManagement /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/departments/concierge" element={<CEOOnly><CEODashboardLayout><CEODepartmentConcierge /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/departments/sales" element={<CEOOnly><CEODashboardLayout><CEODepartmentSales /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/departments/operations" element={<CEOOnly><CEODashboardLayout><CEODepartmentOperations /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/departments/finance" element={<CEOOnly><CEODashboardLayout><CEODepartmentFinance /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/departments/saudemax" element={<CEOOnly><CEODashboardLayout><CEODepartmentSaudeMAX /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/board" element={<CEOOnly><CEODashboardLayout><CEOBoardPacket /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/initiatives" element={<CEOOnly><CEODashboardLayout><CEOHome /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/approvals" element={<CEOOnly><CEODashboardLayout><CEOHome /></CEODashboardLayout></CEOOnly>} />

            <Route path="/shared/overview" element={<SharedOverview />} />
            <Route path="/shared/audit" element={<AuditLogViewer />} />
            <Route path="/diagnostics" element={<AuthDiagnostics />} />

            {/* Shared Operations & Management Routes */}
            <Route path="/shared/saas" element={<SaaSSpend />} />
            <Route path="/shared/ai-agents" element={<AIAgents />} />
            <Route path="/shared/it-support" element={<ITSupport />} />
            <Route path="/shared/integrations" element={<IntegrationsHub />} />
            <Route path="/shared/deployments" element={<Deployments />} />
            <Route path="/shared/policy-management" element={<PolicyManagement />} />
            <Route path="/shared/employee-performance" element={<EmployeePerformance />} />
            <Route path="/shared/api-status" element={<APIStatus />} />
            <Route path="/shared/system-uptime" element={<SystemUptime />} />
            <Route path="/shared/performance-evaluation" element={<PerformanceEvaluation />} />
            <Route path="/shared/organizational-structure" element={<OrganizationalStructure />} />

            {/* Legacy CTO Routes for backward compatibility */}
            <Route path="/overview" element={<Overview />} />
            <Route path="/tech-stack" element={<TechStack />} />
            <Route path="/quick-links" element={<QuickLinks />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/road-visualizer" element={<RoadVisualizerWithFilters />} />
            <Route path="/roadmap-presentation" element={<RoadmapPresentation />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/monday-tasks" element={<MondayTasks />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/notepad" element={<Notepad />} />

            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </Suspense>
        </CEOErrorBoundary>
      </main>
    </div>
  );
}

function DualDashboardApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <DualDashboardContent />
    </QueryClientProvider>
  );
}

export default DualDashboardApp;
