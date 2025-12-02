import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useRoleBasedRedirect } from './hooks/useDualDashboard';
import { CEOOnly, CTOOnly } from './components/guards/RoleGuard';
import { CEOErrorBoundary } from './components/ceo/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import { CEODashboardLayout } from './components/layouts/CEODashboardLayout';
import Sidebar from './components/Sidebar';
import { buildRouteToTabMap, buildTabToRouteMap, getNavigationForRole } from './config/navigation';

const CTOHome = lazy(() => import('./components/pages/ctod/CTOHome').then(m => ({ default: m.CTOHome })));
const CTOOperations = lazy(() => import('./components/pages/ctod/CTOOperations').then(m => ({ default: m.CTOOperations })));

// CTO Development & Planning
const CTODevelopmentOverview = lazy(() => import('./components/pages/ctod/development/CTODevelopmentOverview').then(m => ({ default: m.CTODevelopmentOverview })));
const CTOTechStack = lazy(() => import('./components/pages/ctod/development/CTOTechStack').then(m => ({ default: m.CTOTechStack })));
const CTOQuickLinks = lazy(() => import('./components/pages/ctod/development/CTOQuickLinks').then(m => ({ default: m.CTOQuickLinks })));
const CTORoadmap = lazy(() => import('./components/pages/ctod/development/CTORoadmap').then(m => ({ default: m.CTORoadmap })));
const CTORoadmapVisualizer = lazy(() => import('./components/pages/ctod/development/CTORoadmapVisualizer').then(m => ({ default: m.CTORoadmapVisualizer })));
const CTORoadmapPresentation = lazy(() => import('./components/pages/ctod/development/CTORoadmapPresentation').then(m => ({ default: m.CTORoadmapPresentation })));
const CTOProjects = lazy(() => import('./components/pages/ctod/development/CTOProjects').then(m => ({ default: m.CTOProjects })));
const CTOMondayTasks = lazy(() => import('./components/pages/ctod/development/CTOMondayTasks').then(m => ({ default: m.CTOMondayTasks })));
const CTOAssignments = lazy(() => import('./components/pages/ctod/development/CTOAssignments').then(m => ({ default: m.CTOAssignments })));
const CTONotepad = lazy(() => import('./components/pages/ctod/development/CTONotepad').then(m => ({ default: m.CTONotepad })));

// CTO Compliance
const CTOComplianceDashboard = lazy(() => import('./components/pages/ctod/compliance/CTOComplianceDashboard').then(m => ({ default: m.CTOComplianceDashboard })));
const CTOComplianceAdministration = lazy(() => import('./components/pages/ctod/compliance/CTOComplianceAdministration').then(m => ({ default: m.CTOComplianceAdministration })));
const CTOComplianceTraining = lazy(() => import('./components/pages/ctod/compliance/CTOComplianceTraining').then(m => ({ default: m.CTOComplianceTraining })));
const CTOCompliancePHI = lazy(() => import('./components/pages/ctod/compliance/CTOCompliancePHI').then(m => ({ default: m.CTOCompliancePHI })));
const CTOComplianceTechnical = lazy(() => import('./components/pages/ctod/compliance/CTOComplianceTechnical').then(m => ({ default: m.CTOComplianceTechnical })));
const CTOComplianceBAAs = lazy(() => import('./components/pages/ctod/compliance/CTOComplianceBAAs').then(m => ({ default: m.CTOComplianceBAAs })));
const CTOComplianceIncidents = lazy(() => import('./components/pages/ctod/compliance/CTOComplianceIncidents').then(m => ({ default: m.CTOComplianceIncidents })));
const CTOComplianceAudits = lazy(() => import('./components/pages/ctod/compliance/CTOComplianceAudits').then(m => ({ default: m.CTOComplianceAudits })));
const CTOComplianceTemplates = lazy(() => import('./components/pages/ctod/compliance/CTOComplianceTemplates').then(m => ({ default: m.CTOComplianceTemplates })));
const CTOEmployeeDocuments = lazy(() => import('./components/pages/ctod/compliance/CTOEmployeeDocuments').then(m => ({ default: m.CTOEmployeeDocuments })));

// CTO Operations
const CTOSaaSSpend = lazy(() => import('./components/pages/ctod/operations/CTOSaaSSpend').then(m => ({ default: m.CTOSaaSSpend })));
const CTOAIAgents = lazy(() => import('./components/pages/ctod/operations/CTOAIAgents').then(m => ({ default: m.CTOAIAgents })));
const CTOITSupport = lazy(() => import('./components/pages/ctod/operations/CTOITSupport').then(m => ({ default: m.CTOITSupport })));
const CTOIntegrationsHub = lazy(() => import('./components/pages/ctod/operations/CTOIntegrationsHub').then(m => ({ default: m.CTOIntegrationsHub })));
const CTOPolicyManagement = lazy(() => import('./components/pages/ctod/operations/CTOPolicyManagement').then(m => ({ default: m.CTOPolicyManagement })));
const CTOEmployeePerformance = lazy(() => import('./components/pages/ctod/operations/CTOEmployeePerformance').then(m => ({ default: m.CTOEmployeePerformance })));
const CTOPerformanceEvaluation = lazy(() => import('./components/pages/ctod/operations/CTOPerformanceEvaluation').then(m => ({ default: m.CTOPerformanceEvaluation })));
const CTOOrganization = lazy(() => import('./components/pages/ctod/operations/CTOOrganization').then(m => ({ default: m.CTOOrganization })));

// CTO Infrastructure
const CTODeployments = lazy(() => import('./components/pages/ctod/infrastructure/CTODeployments').then(m => ({ default: m.CTODeployments })));
const CTOAPIStatus = lazy(() => import('./components/pages/ctod/infrastructure/CTOAPIStatus').then(m => ({ default: m.CTOAPIStatus })));
const CTOSystemUptime = lazy(() => import('./components/pages/ctod/infrastructure/CTOSystemUptime').then(m => ({ default: m.CTOSystemUptime })));

// CTO Analytics
const CTOAnalyticsOverview = lazy(() => import('./components/pages/ctod/analytics/CTOAnalyticsOverview').then(m => ({ default: m.CTOAnalyticsOverview })));
const CTOMemberEngagement = lazy(() => import('./components/pages/ctod/analytics/CTOMemberEngagement').then(m => ({ default: m.CTOMemberEngagement })));
const CTOMemberRetention = lazy(() => import('./components/pages/ctod/analytics/CTOMemberRetention').then(m => ({ default: m.CTOMemberRetention })));
const CTOAdvisorPerformance = lazy(() => import('./components/pages/ctod/analytics/CTOAdvisorPerformance').then(m => ({ default: m.CTOAdvisorPerformance })));
const CTOMarketingAnalytics = lazy(() => import('./components/pages/ctod/analytics/CTOMarketingAnalytics').then(m => ({ default: m.CTOMarketingAnalytics })));

const CEOHome = lazy(() => import('./components/pages/ceod/CEOHome').then(m => ({ default: m.CEOHome })));

// CEO Analytics
const CEOAnalyticsOverview = lazy(() => import('./components/pages/ceod/analytics/CEOAnalyticsOverview').then(m => ({ default: m.CEOAnalyticsOverview })));
const CEOMemberEngagement = lazy(() => import('./components/pages/ceod/analytics/CEOMemberEngagement').then(m => ({ default: m.CEOMemberEngagement })));
const CEOMemberRetention = lazy(() => import('./components/pages/ceod/analytics/CEOMemberRetention').then(m => ({ default: m.CEOMemberRetention })));
const CEOAdvisorPerformance = lazy(() => import('./components/pages/ceod/analytics/CEOAdvisorPerformance').then(m => ({ default: m.CEOAdvisorPerformance })));
const CEOMarketingAnalytics = lazy(() => import('./components/pages/ceod/analytics/CEOMarketingAnalytics').then(m => ({ default: m.CEOMarketingAnalytics })));

// CEO Development & Planning
const CEODevelopmentOverview = lazy(() => import('./components/pages/ceod/development/CEODevelopmentOverview').then(m => ({ default: m.CEODevelopmentOverview })));
const CEOTechStack = lazy(() => import('./components/pages/ceod/development/CEOTechStack').then(m => ({ default: m.CEOTechStack })));
const CEOQuickLinks = lazy(() => import('./components/pages/ceod/development/CEOQuickLinks').then(m => ({ default: m.CEOQuickLinks })));
const CEORoadmap = lazy(() => import('./components/pages/ceod/development/CEORoadmap').then(m => ({ default: m.CEORoadmap })));
const CEORoadmapVisualizer = lazy(() => import('./components/pages/ceod/development/CEORoadmapVisualizer').then(m => ({ default: m.CEORoadmapVisualizer })));
const CEORoadmapPresentation = lazy(() => import('./components/pages/ceod/development/CEORoadmapPresentation').then(m => ({ default: m.CEORoadmapPresentation })));
const CEOProjects = lazy(() => import('./components/pages/ceod/development/CEOProjects').then(m => ({ default: m.CEOProjects })));
const CEOAssignments = lazy(() => import('./components/pages/ceod/development/CEOAssignments').then(m => ({ default: m.CEOAssignments })));
const CEONotepad = lazy(() => import('./components/pages/ceod/development/CEONotepad').then(m => ({ default: m.CEONotepad })));

// CEO Operations
const CEOSaaSSpend = lazy(() => import('./components/pages/ceod/operations/CEOSaaSSpend').then(m => ({ default: m.CEOSaaSSpend })));
const CEOCompliance = lazy(() => import('./components/pages/ceod/operations/CEOCompliance').then(m => ({ default: m.CEOCompliance })));
const CEOAIAgents = lazy(() => import('./components/pages/ceod/operations/CEOAIAgents').then(m => ({ default: m.CEOAIAgents })));
const CEOITSupport = lazy(() => import('./components/pages/ceod/operations/CEOITSupport').then(m => ({ default: m.CEOITSupport })));
const CEOIntegrationsHub = lazy(() => import('./components/pages/ceod/operations/CEOIntegrationsHub').then(m => ({ default: m.CEOIntegrationsHub })));
const CEOPolicyManager = lazy(() => import('./components/pages/ceod/operations/CEOPolicyManager').then(m => ({ default: m.CEOPolicyManager })));
const CEOEmployeePerformance = lazy(() => import('./components/pages/ceod/operations/CEOEmployeePerformance').then(m => ({ default: m.CEOEmployeePerformance })));
const CEOPerformanceEvaluation = lazy(() => import('./components/pages/ceod/operations/CEOPerformanceEvaluation').then(m => ({ default: m.CEOPerformanceEvaluation })));
const CEOOrganization = lazy(() => import('./components/pages/ceod/operations/CEOOrganization').then(m => ({ default: m.CEOOrganization })));

// CEO Marketing & Other Pages
const CEOMarketingDashboard = lazy(() => import('./components/pages/ceod/CEOMarketingDashboard').then(m => ({ default: m.CEOMarketingDashboard })));
const CEOMarketingPlanner = lazy(() => import('./components/pages/ceod/CEOMarketingPlanner').then(m => ({ default: m.CEOMarketingPlanner })));
const CEOContentCalendar = lazy(() => import('./components/pages/ceod/CEOContentCalendar').then(m => ({ default: m.CEOContentCalendar })));
const CEOMarketingBudget = lazy(() => import('./components/pages/ceod/CEOMarketingBudget').then(m => ({ default: m.CEOMarketingBudget })));
const CEOBoardPacket = lazy(() => import('./components/pages/ceod/CEOBoardPacket').then(m => ({ default: m.CEOBoardPacket })));
const CEOConciergeTracking = lazy(() => import('./components/pages/ceod/CEOConciergeTracking').then(m => ({ default: m.CEOConciergeTracking })));
const CEOConciergeNotes = lazy(() => import('./components/pages/ceod/CEOConciergeNotes').then(m => ({ default: m.CEOConciergeNotes })));
const CEOSalesReports = lazy(() => import('./components/pages/ceod/CEOSalesReportsEnhanced').then(m => ({ default: m.CEOSalesReportsEnhanced })));
const CEOFiles = lazy(() => import('./components/pages/ceod/CEOFiles').then(m => ({ default: m.CEOFiles })));
const CTOFiles = lazy(() => import('./components/pages/ctod/CTOFiles').then(m => ({ default: m.CTOFiles })));
const CEODataManagement = lazy(() => import('./components/pages/ceod/CEODataManagement').then(m => ({ default: m.CEODataManagement })));
const CEODepartmentUpload = lazy(() => import('./components/pages/ceod/CEODepartmentUpload').then(m => ({ default: m.CEODepartmentUpload })));
const CEODepartmentUploadPortal = lazy(() => import('./components/pages/ceod/CEODepartmentUploadPortal').then(m => ({ default: m.CEODepartmentUploadPortal })));
const CEOConciergeUpload = lazy(() => import('./components/pages/ceod/CEOConciergeUpload').then(m => ({ default: m.CEOConciergeUpload })));
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
const DiagnosticsDashboard = lazy(() => import('./components/pages/DiagnosticsDashboard'));
const Settings = lazy(() => import('./components/pages/Settings'));

// Shared components (legacy)
const SaaSSpend = lazy(() => import('./components/pages/SaaSSpend'));
const AIAgents = lazy(() => import('./components/pages/AIAgents'));
const ITSupport = lazy(() => import('./components/pages/ITSupport'));
const IntegrationsHub = lazy(() => import('./components/pages/IntegrationsHub'));
const Deployments = lazy(() => import('./components/pages/Deployments'));
const PolicyManagement = lazy(() => import('./components/pages/PolicyManagement'));
const EmployeePerformance = lazy(() => import('./components/pages/EmployeePerformance'));
const APIStatus = lazy(() => import('./components/pages/APIStatus'));
const SystemUptime = lazy(() => import('./components/pages/SystemUptime'));
const PerformanceEvaluation = lazy(() => import('./components/pages/PerformanceEvaluation'));
const OrganizationalStructure = lazy(() => import('./components/pages/OrganizationalStructure'));

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

const LoadingFallback = () => (
  <div 
    className="flex items-center justify-center min-h-screen bg-slate-50"
    style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
  >
    <div className="text-center px-4">
      <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="text-gray-500 text-sm mt-4">Loading...</p>
    </div>
  </div>
);

function RoleBasedRedirect() {
  const { redirectPath, isLoading } = useRoleBasedRedirect();
  const { profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  if (location.pathname === '/' || location.pathname === '') {
    const defaultPath = profile?.role === 'ceo' ? '/ceod/home' : '/ctod/home';
    return <Navigate to={defaultPath} replace />;
  }

  return null;
}


function DualDashboardContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, profileReady, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const isCEORoute = useMemo(() => location.pathname.startsWith('/ceod/'), [location.pathname]);

  const shouldShowCTOSidebar = useMemo(() => {
    if (!profileReady) return false;
    if (isCEORoute) return false;
    const role = profile?.role?.toLowerCase();
    if (role === 'ceo') return false;
    return role === 'cto' || role === 'admin' || role === 'staff';
  }, [profileReady, isCEORoute, profile?.role]);

  const navigationItems = useMemo(() => {
    const role = profile?.role || 'staff';
    return getNavigationForRole(role as 'ceo' | 'cto' | 'admin' | 'staff');
  }, [profile?.role]);

  const routeToTabMap = useMemo(() => buildRouteToTabMap(navigationItems), [navigationItems]);
  const tabToRouteMap = useMemo(() => buildTabToRouteMap(navigationItems), [navigationItems]);

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
  }, [location.pathname, isCEORoute, profileReady, routeToTabMap]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    const route = tabToRouteMap[tab];
    if (route) {
      navigate(route);
    }
  }, [navigate, tabToRouteMap]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-slate-50"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!profileReady) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-slate-50"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base">Loading your dashboard...</p>
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

      {/* Mobile hamburger menu button */}
      {shouldShowCTOSidebar && isMobile && !isSidebarExpanded && (
        <button
          className="
            fixed z-50 md:hidden
            p-3 rounded-xl
            bg-indigo-600 text-white 
            shadow-lg shadow-indigo-500/30
            touch-manipulation
            active:scale-95 active:bg-indigo-700
            transition-all duration-200
            min-h-[44px] min-w-[44px]
            flex items-center justify-center
            mobile-hamburger
          "
          style={{
            top: 'max(1rem, env(safe-area-inset-top))',
            left: 'max(1rem, env(safe-area-inset-left))',
          }}
          onClick={toggleSidebar}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <main 
        className={`
          flex-1 overflow-y-auto overflow-x-hidden
          ${isCEORoute
            ? ''
            : `
              transition-all duration-300 ease-out
              ${isMobile 
                ? 'px-4 py-4' 
                : 'px-6 md:px-8 lg:px-12 py-6 md:py-8'
              } 
              ${isSidebarExpanded 
                ? 'md:pl-[21rem] lg:pl-[22rem]' 
                : isMobile 
                  ? 'pl-4' 
                  : 'md:pl-24 lg:pl-28'
              }
            `
          }
        `}
        style={{
          // Add top padding for mobile hamburger button when sidebar is closed
          paddingTop: shouldShowCTOSidebar && isMobile && !isSidebarExpanded 
            ? 'max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem))' 
            : isMobile 
              ? 'max(1rem, env(safe-area-inset-top))' 
              : undefined,
          // Add bottom safe area
          paddingBottom: isMobile ? 'max(1rem, env(safe-area-inset-bottom))' : undefined,
        }}
      >
        <CEOErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            {/* CTO Home */}
            <Route path="/ctod/home" element={<CTOOnly><CTOHome /></CTOOnly>} />
            <Route path="/ctod/files" element={<CTOOnly><CTOFiles /></CTOOnly>} />
            <Route path="/ctod/kpis" element={<CTOOnly><CTOHome /></CTOOnly>} />
            <Route path="/ctod/engineering" element={<CTOOnly><CTOHome /></CTOOnly>} />

            {/* CTO Analytics Routes */}
            <Route path="/ctod/analytics" element={<CTOOnly><CTOAnalyticsOverview /></CTOOnly>} />
            <Route path="/ctod/analytics/overview" element={<CTOOnly><CTOAnalyticsOverview /></CTOOnly>} />
            <Route path="/ctod/analytics/member-engagement" element={<CTOOnly><CTOMemberEngagement /></CTOOnly>} />
            <Route path="/ctod/analytics/member-retention" element={<CTOOnly><CTOMemberRetention /></CTOOnly>} />
            <Route path="/ctod/analytics/advisor-performance" element={<CTOOnly><CTOAdvisorPerformance /></CTOOnly>} />
            <Route path="/ctod/analytics/marketing" element={<CTOOnly><CTOMarketingAnalytics /></CTOOnly>} />

            {/* CTO Development & Planning Routes */}
            <Route path="/ctod/development" element={<CTOOnly><CTODevelopmentOverview /></CTOOnly>} />
            <Route path="/ctod/development/tech-stack" element={<CTOOnly><CTOTechStack /></CTOOnly>} />
            <Route path="/ctod/development/quicklinks" element={<CTOOnly><CTOQuickLinks /></CTOOnly>} />
            <Route path="/ctod/development/roadmap" element={<CTOOnly><CTORoadmap /></CTOOnly>} />
            <Route path="/ctod/development/roadmap-visualizer" element={<CTOOnly><CTORoadmapVisualizer /></CTOOnly>} />
            <Route path="/ctod/development/roadmap-presentation" element={<CTOOnly><CTORoadmapPresentation /></CTOOnly>} />
            <Route path="/ctod/development/projects" element={<CTOOnly><CTOProjects /></CTOOnly>} />
            <Route path="/ctod/development/monday-tasks" element={<CTOOnly><CTOMondayTasks /></CTOOnly>} />
            <Route path="/ctod/development/assignments" element={<CTOOnly><CTOAssignments /></CTOOnly>} />
            <Route path="/ctod/development/notepad" element={<CTOOnly><CTONotepad /></CTOOnly>} />

            {/* CTO Compliance Routes */}
            <Route path="/ctod/compliance" element={<CTOOnly><CTOComplianceDashboard /></CTOOnly>} />
            <Route path="/ctod/compliance/dashboard" element={<CTOOnly><CTOComplianceDashboard /></CTOOnly>} />
            <Route path="/ctod/compliance/administration" element={<CTOOnly><CTOComplianceAdministration /></CTOOnly>} />
            <Route path="/ctod/compliance/training" element={<CTOOnly><CTOComplianceTraining /></CTOOnly>} />
            <Route path="/ctod/compliance/phi-minimum" element={<CTOOnly><CTOCompliancePHI /></CTOOnly>} />
            <Route path="/ctod/compliance/technical-safeguards" element={<CTOOnly><CTOComplianceTechnical /></CTOOnly>} />
            <Route path="/ctod/compliance/baas" element={<CTOOnly><CTOComplianceBAAs /></CTOOnly>} />
            <Route path="/ctod/compliance/incidents" element={<CTOOnly><CTOComplianceIncidents /></CTOOnly>} />
            <Route path="/ctod/compliance/audits" element={<CTOOnly><CTOComplianceAudits /></CTOOnly>} />
            <Route path="/ctod/compliance/templates-tools" element={<CTOOnly><CTOComplianceTemplates /></CTOOnly>} />
            <Route path="/ctod/compliance/employee-documents" element={<CTOOnly><CTOEmployeeDocuments /></CTOOnly>} />

            {/* CTO Operations Routes */}
            <Route path="/ctod/operations" element={<CTOOnly><CTOOperations /></CTOOnly>} />
            <Route path="/ctod/operations/saas-spend" element={<CTOOnly><CTOSaaSSpend /></CTOOnly>} />
            <Route path="/ctod/operations/ai-agents" element={<CTOOnly><CTOAIAgents /></CTOOnly>} />
            <Route path="/ctod/operations/it-support" element={<CTOOnly><CTOITSupport /></CTOOnly>} />
            <Route path="/ctod/operations/integrations" element={<CTOOnly><CTOIntegrationsHub /></CTOOnly>} />
            <Route path="/ctod/operations/policy-manager" element={<CTOOnly><CTOPolicyManagement /></CTOOnly>} />
            <Route path="/ctod/operations/employee-performance" element={<CTOOnly><CTOEmployeePerformance /></CTOOnly>} />
            <Route path="/ctod/operations/performance-evaluation" element={<CTOOnly><CTOPerformanceEvaluation /></CTOOnly>} />
            <Route path="/ctod/operations/organization" element={<CTOOnly><CTOOrganization /></CTOOnly>} />

            {/* CTO Infrastructure Routes */}
            <Route path="/ctod/infrastructure/deployments" element={<CTOOnly><CTODeployments /></CTOOnly>} />
            <Route path="/ctod/infrastructure/api-status" element={<CTOOnly><CTOAPIStatus /></CTOOnly>} />
            <Route path="/ctod/infrastructure/system-uptime" element={<CTOOnly><CTOSystemUptime /></CTOOnly>} />

            {/* CTO Settings */}
            <Route path="/ctod/settings" element={<CTOOnly><Settings /></CTOOnly>} />

            <Route path="/ceod/home" element={<CEOOnly><CEODashboardLayout><CEOHome /></CEODashboardLayout></CEOOnly>} />

            {/* CEO Analytics Routes */}
            <Route path="/ceod/analytics" element={<CEOOnly><CEODashboardLayout><CEOAnalyticsOverview /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/overview" element={<CEOOnly><CEODashboardLayout><CEOAnalyticsOverview /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/member-engagement" element={<CEOOnly><CEODashboardLayout><CEOMemberEngagement /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/member-retention" element={<CEOOnly><CEODashboardLayout><CEOMemberRetention /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/advisor-performance" element={<CEOOnly><CEODashboardLayout><CEOAdvisorPerformance /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/analytics/marketing" element={<CEOOnly><CEODashboardLayout><CEOMarketingAnalytics /></CEODashboardLayout></CEOOnly>} />

            {/* CEO Development & Planning Routes */}
            <Route path="/ceod/development" element={<CEOOnly><CEODashboardLayout><CEODevelopmentOverview /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/development/tech-stack" element={<CEOOnly><CEODashboardLayout><CEOTechStack /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/development/quicklinks" element={<CEOOnly><CEODashboardLayout><CEOQuickLinks /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/development/roadmap" element={<CEOOnly><CEODashboardLayout><CEORoadmap /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/development/roadmap-visualizer" element={<CEOOnly><CEODashboardLayout><CEORoadmapVisualizer /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/development/roadmap-presentation" element={<CEOOnly><CEODashboardLayout><CEORoadmapPresentation /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/development/projects" element={<CEOOnly><CEODashboardLayout><CEOProjects /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/development/assignments" element={<CEOOnly><CEODashboardLayout><CEOAssignments /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/development/notepad" element={<CEOOnly><CEODashboardLayout><CEONotepad /></CEODashboardLayout></CEOOnly>} />

            {/* CEO Marketing Routes */}
            <Route path="/ceod/marketing" element={<CEOOnly><CEODashboardLayout><CEOMarketingDashboard /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/marketing/planner" element={<CEOOnly><CEODashboardLayout><CEOMarketingPlanner /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/marketing/calendar" element={<CEOOnly><CEODashboardLayout><CEOContentCalendar /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/marketing/budget" element={<CEOOnly><CEODashboardLayout><CEOMarketingBudget /></CEODashboardLayout></CEOOnly>} />

            {/* CEO Concierge Routes */}
            <Route path="/ceod/concierge/tracking" element={<CEOOnly><CEODashboardLayout><CEOConciergeTracking /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/concierge/notes" element={<CEOOnly><CEODashboardLayout><CEOConciergeNotes /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/concierge/reports" element={<CEOOnly><CEODashboardLayout><CEOConciergeTrackingReports /></CEODashboardLayout></CEOOnly>} />

            {/* CEO Sales Routes */}
            <Route path="/ceod/sales/reports" element={<CEOOnly><CEODashboardLayout><CEOSalesReports /></CEODashboardLayout></CEOOnly>} />

            {/* CEO Operations Routes */}
            <Route path="/ceod/operations/overview" element={<CEOOnly><CEODashboardLayout><CEOOperationsDashboard /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/tracking" element={<CEOOnly><CEODashboardLayout><CEOOperationsTrackingReports /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/compliance" element={<CEOOnly><CEODashboardLayout><CEOCompliance /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/saas-spend" element={<CEOOnly><CEODashboardLayout><CEOSaaSSpend /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/ai-agents" element={<CEOOnly><CEODashboardLayout><CEOAIAgents /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/it-support" element={<CEOOnly><CEODashboardLayout><CEOITSupport /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/integrations" element={<CEOOnly><CEODashboardLayout><CEOIntegrationsHub /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/policy-manager" element={<CEOOnly><CEODashboardLayout><CEOPolicyManager /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/employee-performance" element={<CEOOnly><CEODashboardLayout><CEOEmployeePerformance /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/performance-evaluation" element={<CEOOnly><CEODashboardLayout><CEOPerformanceEvaluation /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/operations/organization" element={<CEOOnly><CEODashboardLayout><CEOOrganization /></CEODashboardLayout></CEOOnly>} />

            <Route path="/ceod/finance" element={<CEOOnly><CEODashboardLayout><CEOFinanceSnapshot /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/finance/overview" element={<CEOOnly><CEODashboardLayout><CEOFinanceSnapshot /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/saudemax/reports" element={<CEOOnly><CEODashboardLayout><CEOSaudeMAXReports /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/upload-portal" element={<CEOOnly><CEODashboardLayout><CEODepartmentUploadPortal /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/upload" element={<CEOOnly><CEODashboardLayout><CEODepartmentUpload /></CEODashboardLayout></CEOOnly>} />
            <Route path="/ceod/concierge-upload" element={<CEOOnly><CEODashboardLayout><CEOConciergeUpload /></CEODashboardLayout></CEOOnly>} />
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

            {/* CEO Settings */}
            <Route path="/ceod/settings" element={<CEOOnly><CEODashboardLayout><Settings /></CEODashboardLayout></CEOOnly>} />

            <Route path="/shared/overview" element={<SharedOverview />} />
            <Route path="/shared/audit" element={<AuditLogViewer />} />
            <Route path="/diagnostics" element={<AuthDiagnostics />} />
            <Route path="/diagnostics/system" element={<DiagnosticsDashboard />} />

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

            {/* Legacy CTO Routes for backward compatibility - Protected with CTOOnly */}
            <Route path="/overview" element={<CTOOnly><Overview /></CTOOnly>} />
            <Route path="/tech-stack" element={<CTOOnly><TechStack /></CTOOnly>} />
            <Route path="/quick-links" element={<CTOOnly><QuickLinks /></CTOOnly>} />
            <Route path="/roadmap" element={<CTOOnly><Roadmap /></CTOOnly>} />
            <Route path="/road-visualizer" element={<CTOOnly><RoadVisualizerWithFilters /></CTOOnly>} />
            <Route path="/roadmap-presentation" element={<CTOOnly><RoadmapPresentation /></CTOOnly>} />
            <Route path="/projects" element={<CTOOnly><Projects /></CTOOnly>} />
            <Route path="/monday-tasks" element={<CTOOnly><MondayTasks /></CTOOnly>} />
            <Route path="/assignments" element={<CTOOnly><Assignments /></CTOOnly>} />
            <Route path="/notepad" element={<CTOOnly><Notepad /></CTOOnly>} />

            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </Suspense>
        </CEOErrorBoundary>
      </main>
    </div>
  );
}

export default function DualDashboardApp() {
  return <DualDashboardContent />;
}
