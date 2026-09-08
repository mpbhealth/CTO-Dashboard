import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import { AppShell } from './components/shell/AppShell';
import { buildRouteToTabMap, buildTabToRouteMap, getNavigationForRole } from './config/navigation';
import { AIAssistantProvider } from './providers/AIAssistantProvider';
import { GlobalAIAssistant } from './components/ai/GlobalAIAssistant';
import { Breadcrumbs } from './components/ui/Breadcrumbs';
import { KeyboardShortcutsModal } from './components/ui/KeyboardShortcutsModal';
import { SessionTimeoutWarning } from './components/security/SessionTimeoutWarning';
import { MFARequiredGuard } from './components/security/MFARequiredGuard';
import { UpdateBanner } from './components/ui/UpdateBanner';
import { InstallAppBanner } from './components/ui/InstallAppBanner';
import { remapLegacyPath } from './lib/cos';

const CosHome = lazy(() => import('./components/pages/CosHome'));
const CosInbox = lazy(() => import('./components/pages/CosInbox'));
const CosCrmList = lazy(() => import('./components/pages/CosCrmList'));
const CosCrmDetail = lazy(() => import('./components/pages/CosCrmDetail'));
const DailyOrganizer = lazy(() => import('./components/pages/DailyOrganizer'));
const Settings = lazy(() => import('./components/pages/Settings'));
const OAuthCallback = lazy(() => import('./components/pages/OAuthCallback').then(m => ({ default: m.OAuthCallback })));

const AnalyticsOverview = lazy(() => import('./components/pages/ctod/analytics/CTOAnalyticsOverview').then(m => ({ default: m.CTOAnalyticsOverview })));
const MemberEngagement = lazy(() => import('./components/pages/ctod/analytics/CTOMemberEngagement').then(m => ({ default: m.CTOMemberEngagement })));
const MemberRetention = lazy(() => import('./components/pages/ctod/analytics/CTOMemberRetention').then(m => ({ default: m.CTOMemberRetention })));
const AdvisorPerformance = lazy(() => import('./components/pages/ctod/analytics/CTOAdvisorPerformance').then(m => ({ default: m.CTOAdvisorPerformance })));
const MarketingAnalytics = lazy(() => import('./components/pages/ctod/analytics/CTOMarketingAnalytics').then(m => ({ default: m.CTOMarketingAnalytics })));
const WebsiteAnalytics = lazy(() => import('./components/pages/ctod/analytics/CTOWebsiteAnalytics').then(m => ({ default: m.CTOWebsiteAnalytics })));

const DevelopmentOverview = lazy(() => import('./components/pages/ctod/development/CTODevelopmentOverview').then(m => ({ default: m.CTODevelopmentOverview })));
const TechStack = lazy(() => import('./components/pages/TechStack'));
const QuickLinks = lazy(() => import('./components/pages/QuickLinks'));
const Roadmap = lazy(() => import('./components/pages/Roadmap'));
const RoadVisualizer = lazy(() => import('./components/pages/RoadVisualizerWithFilters'));
const Projects = lazy(() => import('./components/pages/Projects'));
const Assignments = lazy(() => import('./components/pages/Assignments'));
const Notepad = lazy(() => import('./components/pages/Notepad'));

const Operations = lazy(() => import('./components/pages/ctod/CTOOperations').then(m => ({ default: m.CTOOperations })));
const Compliance = lazy(() => import('./components/pages/ctod/compliance/CTOComplianceDashboard').then(m => ({ default: m.CTOComplianceDashboard })));
const SaaSSpend = lazy(() => import('./components/pages/SaaSSpend'));
const ITSupport = lazy(() => import('./components/pages/ITSupport'));
const IntegrationsHub = lazy(() => import('./components/pages/IntegrationsHub'));
const PolicyManagement = lazy(() => import('./components/pages/PolicyManagement'));
const OrganizationalStructure = lazy(() => import('./components/pages/OrganizationalStructure'));
const Deployments = lazy(() => import('./components/pages/Deployments'));
const Files = lazy(() => import('./components/pages/ctod/CTOFiles').then(m => ({ default: m.CTOFiles })));

const LoadingFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center" role="status">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-white/40" />
  </div>
);

function LegacyRedirect() {
  const location = useLocation();
  const next = remapLegacyPath(location.pathname);
  if (next && next !== location.pathname) {
    return <Navigate to={next} replace />;
  }
  return <Navigate to="/home" replace />;
}

function CosContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileReady, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const navigationItems = useMemo(() => getNavigationForRole('cos'), []);
  const routeToTabMap = useMemo(() => buildRouteToTabMap(navigationItems), [navigationItems]);
  const tabToRouteMap = useMemo(() => buildTabToRouteMap(navigationItems), [navigationItems]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarExpanded(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const matched = routeToTabMap[location.pathname];
    if (matched) setActiveTab(matched);
  }, [location.pathname, routeToTabMap]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    const route = tabToRouteMap[tab];
    if (route) navigate(route);
  }, [navigate, tabToRouteMap]);

  if (loading || !profileReady) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#050505]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-white/40" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] overflow-x-hidden bg-[#050505]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isSidebarExpanded={isSidebarExpanded}
        onSidebarToggle={() => setIsSidebarExpanded((v) => !v)}
      />

      {isMobile && !isSidebarExpanded && (
        <button
          className="fixed left-4 top-4 z-[70] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
          onClick={() => setIsSidebarExpanded(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <main
        id="main-content"
        className={`min-h-[100dvh] flex-1 overflow-y-auto ${
          isSidebarExpanded ? 'md:pl-[21rem]' : 'md:pl-24'
        }`}
      >
        <Breadcrumbs />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<CosHome />} />
            <Route path="/inbox" element={<CosInbox />} />
            <Route path="/organizer" element={<DailyOrganizer dashboardRole="cos" />} />
            <Route path="/crm" element={<CosCrmList />} />
            <Route path="/crm/:kind/:id" element={<CosCrmDetail />} />
            <Route path="/analytics" element={<AnalyticsOverview />} />
            <Route path="/analytics/overview" element={<AnalyticsOverview />} />
            <Route path="/analytics/member-engagement" element={<MemberEngagement />} />
            <Route path="/analytics/member-retention" element={<MemberRetention />} />
            <Route path="/analytics/advisor-performance" element={<AdvisorPerformance />} />
            <Route path="/analytics/marketing" element={<MarketingAnalytics />} />
            <Route path="/analytics/website" element={<WebsiteAnalytics />} />
            <Route path="/development" element={<DevelopmentOverview />} />
            <Route path="/development/tech-stack" element={<TechStack />} />
            <Route path="/development/quicklinks" element={<QuickLinks />} />
            <Route path="/development/roadmap" element={<Roadmap />} />
            <Route path="/development/roadmap-visualizer" element={<RoadVisualizer />} />
            <Route path="/development/projects" element={<Projects />} />
            <Route path="/development/assignments" element={<Assignments />} />
            <Route path="/development/notepad" element={<Notepad />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/operations/compliance" element={<Compliance />} />
            <Route path="/operations/saas-spend" element={<SaaSSpend />} />
            <Route path="/operations/it-support" element={<ITSupport />} />
            <Route path="/operations/integrations" element={<IntegrationsHub />} />
            <Route path="/operations/policy-manager" element={<PolicyManagement />} />
            <Route path="/operations/organization" element={<OrganizationalStructure />} />
            <Route path="/operations/infrastructure/deployments" element={<Deployments />} />
            <Route path="/files" element={<Files />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/ceod/*" element={<LegacyRedirect />} />
            <Route path="/ctod/*" element={<LegacyRedirect />} />
            <Route path="/admin/*" element={<Navigate to="/home" replace />} />
            <Route path="/advisor/*" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<LegacyRedirect />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function CosApp() {
  return (
    <AIAssistantProvider>
      <AppShell>
        <MFARequiredGuard>
          <CosContent />
        </MFARequiredGuard>
        <GlobalAIAssistant />
        <KeyboardShortcutsModal />
        <SessionTimeoutWarning />
        <UpdateBanner />
        <InstallAppBanner />
      </AppShell>
    </AIAssistantProvider>
  );
}
