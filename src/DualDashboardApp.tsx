import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { useRoleBasedRedirect } from './hooks/useDualDashboard';
import { CEOOnly, CTOOnly } from './components/guards/RoleGuard';
import Sidebar from './components/Sidebar';

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

const TechStack = lazy(() => import('./components/pages/TechStack'));
const QuickLinks = lazy(() => import('./components/pages/QuickLinks'));
const Roadmap = lazy(() => import('./components/pages/Roadmap'));
const RoadmapPresentation = lazy(() => import('./components/pages/RoadmapPresentation'));
const RoadVisualizerWithFilters = lazy(() => import('./components/pages/RoadVisualizerWithFilters'));
const Projects = lazy(() => import('./components/pages/Projects'));
const MondayTasks = lazy(() => import('./components/pages/MondayTasks'));
const Assignments = lazy(() => import('./components/pages/Assignments'));
const Notepad = lazy(() => import('./components/pages/Notepad'));

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

const routeToTabMap: Record<string, string> = {
  '/ctod/home': 'overview',
  '/ctod/files': 'overview',
  '/ctod/kpis': 'overview',
  '/ctod/engineering': 'tech-stack',
  '/ctod/compliance': 'compliance',
  '/ceod/home': 'overview',
  '/ceod/marketing': 'marketing-analytics',
  '/ceod/marketing/planner': 'marketing-analytics',
  '/ceod/marketing/calendar': 'marketing-analytics',
  '/ceod/marketing/budget': 'marketing-analytics',
  '/ceod/concierge/tracking': 'overview',
  '/ceod/concierge/notes': 'overview',
  '/ceod/sales/reports': 'overview',
  '/ceod/operations/overview': 'overview',
  '/ceod/files': 'overview',
  '/ceod/data': 'overview',
  '/ceod/board': 'overview',
  '/ceod/initiatives': 'overview',
  '/ceod/approvals': 'overview',
  '/shared/overview': 'overview',
  '/shared/audit': 'overview',
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
  'analytics': '/ctod/home',
  'member-engagement': '/ctod/home',
  'member-retention': '/ctod/home',
  'advisor-performance': '/ctod/home',
  'marketing-analytics': '/ceod/marketing',
  'tech-stack': '/tech-stack',
  'quick-links': '/quick-links',
  'roadmap': '/roadmap',
  'road-visualizer': '/road-visualizer',
  'roadmap-presentation': '/roadmap-presentation',
  'projects': '/projects',
  'monday-tasks': '/monday-tasks',
  'assignments': '/assignments',
  'notepad': '/notepad',
  'compliance': '/ctod/compliance',
  'compliance/command-center': '/ctod/compliance',
  'compliance/administration': '/ctod/compliance',
  'compliance/training': '/ctod/compliance',
  'compliance/phi-minimum': '/ctod/compliance',
  'compliance/technical-safeguards': '/ctod/compliance',
  'compliance/baas': '/ctod/compliance',
  'compliance/incidents': '/ctod/compliance',
  'compliance/audits': '/ctod/compliance',
  'compliance/templates-tools': '/ctod/compliance',
  'compliance/employee-documents': '/ctod/compliance',
  'saas': '/ctod/home',
  'ai-agents': '/ctod/home',
  'it-support': '/ctod/home',
  'integrations': '/ctod/home',
  'deployments': '/ctod/home',
  'policy-management': '/ctod/home',
  'employee-performance': '/ctod/home',
  'api-status': '/ctod/home',
  'system-uptime': '/ctod/home',
  'performance-evaluation': '/ctod/home',
  'organizational-structure': '/ctod/home',
};

function DualDashboardContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const route = tabToRouteMap[tab];
    if (route) {
      navigate(route);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isSidebarExpanded={isSidebarExpanded}
        onSidebarToggle={toggleSidebar}
      />

      {isMobile && !isSidebarExpanded && (
        <button
          className="fixed top-4 left-4 p-3 rounded-md bg-sky-600 text-white shadow-lg md:hidden z-50 mobile-hamburger"
          onClick={toggleSidebar}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
        isMobile ? 'p-3' : 'p-8 pl-12'
      } ${
        isSidebarExpanded ? 'md:pl-96' : isMobile ? 'ml-0 pt-16' : 'md:pl-32'
      }`}>
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
