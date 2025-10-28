import { useState, useEffect, lazy, Suspense } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import AuthWrapper from './components/pages/AuthWrapper';
import Overview from './components/pages/Overview';

// Lazy load all page components for code splitting
const Analytics = lazy(() => import('./components/pages/Analytics'));
const MemberEngagement = lazy(() => import('./components/pages/MemberEngagement'));
const MemberRetention = lazy(() => import('./components/pages/MemberRetention'));
const AdvisorPerformance = lazy(() => import('./components/pages/AdvisorPerformance'));
const TechStack = lazy(() => import('./components/pages/TechStack'));
const Roadmap = lazy(() => import('./components/pages/Roadmap'));
const RoadVisualizerWithFilters = lazy(() => import('./components/pages/RoadVisualizerWithFilters'));
const QuickLinks = lazy(() => import('./components/pages/QuickLinks'));
const RoadmapPresentation = lazy(() => import('./components/pages/RoadmapPresentation'));
const Projects = lazy(() => import('./components/pages/Projects'));
const Compliance = lazy(() => import('./components/pages/Compliance'));
const ComplianceCommandCenter = lazy(() => import('./components/pages/ComplianceCommandCenter'));
const ComplianceIncidents = lazy(() => import('./components/pages/ComplianceIncidents'));
const ComplianceBAAs = lazy(() => import('./components/pages/ComplianceBAAs'));
const CompliancePHIAccess = lazy(() => import('./components/pages/CompliancePHIAccess'));
const ComplianceAdministration = lazy(() => import('./components/pages/ComplianceAdministration'));
const ComplianceTraining = lazy(() => import('./components/pages/ComplianceTraining'));
const ComplianceTechnicalSafeguards = lazy(() => import('./components/pages/ComplianceTechnicalSafeguards'));
const ComplianceAudits = lazy(() => import('./components/pages/ComplianceAudits'));
const ComplianceTemplatesTools = lazy(() => import('./components/pages/ComplianceTemplatesTools'));
const SaaSSpend = lazy(() => import('./components/pages/SaaSSpend'));
const AIAgents = lazy(() => import('./components/pages/AIAgents'));
const Deployments = lazy(() => import('./components/pages/Deployments'));
const APIStatus = lazy(() => import('./components/pages/APIStatus'));
const SystemUptime = lazy(() => import('./components/pages/SystemUptime'));
const IntegrationsHub = lazy(() => import('./components/pages/IntegrationsHub'));
const Notepad = lazy(() => import('./components/pages/Notepad'));
const MondayTasks = lazy(() => import('./components/pages/MondayTasks'));
const EmployeePerformance = lazy(() => import('./components/pages/EmployeePerformance'));
const PerformanceEvaluation = lazy(() => import('./components/pages/PerformanceEvaluation'));
const OrganizationalStructure = lazy(() => import('./components/pages/OrganizationalStructure'));
const PolicyManagement = lazy(() => import('./components/pages/PolicyManagement'));
const MarketingAnalytics = lazy(() => import('./components/pages/MarketingAnalytics'));
const Assignments = lazy(() => import('./components/pages/Assignments'));
const EmployeeDocumentStorage = lazy(() => import('./components/pages/EmployeeDocumentStorage'));
const ITSupport = lazy(() => import('./components/pages/ITSupport'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices and set sidebar state accordingly
  useEffect(() => {
    function checkIfMobile() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarExpanded(false);
      }
    }

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const renderContent = () => {
    return (
      <Suspense fallback={<LoadingFallback />}>
        {renderContentInner()}
      </Suspense>
    );
  };

  const renderContentInner = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'analytics':
        return <Analytics />;
      case 'member-engagement':
        return <MemberEngagement />;
      case 'member-retention':
        return <MemberRetention />;
      case 'advisor-performance':
        return <AdvisorPerformance />;
      case 'tech-stack':
        return <TechStack />;
      case 'roadmap':
        return <Roadmap />;
      case 'road-visualizer':
        return <RoadVisualizerWithFilters />;
      case 'quick-links':
        return <QuickLinks />;
      case 'roadmap-presentation':
        return <RoadmapPresentation />;
      case 'projects':
        return <Projects />;
      case 'monday-tasks':
        return <MondayTasks />;
      case 'assignments':
        return <Assignments />;
      case 'compliance':
        return <Compliance />;
      case 'compliance/command-center':
        return <ComplianceCommandCenter />;
      case 'compliance/incidents':
        return <ComplianceIncidents />;
      case 'compliance/baas':
        return <ComplianceBAAs />;
      case 'compliance/phi-minimum':
        return <CompliancePHIAccess />;
      case 'compliance/administration':
        return <ComplianceAdministration />;
      case 'compliance/training':
        return <ComplianceTraining />;
      case 'compliance/technical-safeguards':
        return <ComplianceTechnicalSafeguards />;
      case 'compliance/audits':
        return <ComplianceAudits />;
      case 'compliance/templates-tools':
        return <ComplianceTemplatesTools />;
      case 'compliance/employee-documents':
        return <EmployeeDocumentStorage />;
      case 'saas':
        return <SaaSSpend />;
      case 'ai-agents':
        return <AIAgents />;
      case 'deployments':
        return <Deployments />;
      case 'api-status':
        return <APIStatus />;
      case 'system-uptime':
        return <SystemUptime />;
      case 'integrations':
        return <IntegrationsHub />;
      case 'marketing-analytics':
        return <MarketingAnalytics />;
      case 'employee-performance':
        return <EmployeePerformance />;
      case 'performance-evaluation':
        return <PerformanceEvaluation />;
      case 'notepad':
        return <Notepad />;
      case 'organizational-structure':
        return <OrganizationalStructure />;
      case 'policy-management':
        return <PolicyManagement />;
      case 'it-support':
        return <ITSupport />;
      default:
        return <Overview />;
    }
  };

  return (
    <AuthWrapper>
     <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSidebarExpanded={isSidebarExpanded}
          onSidebarToggle={toggleSidebar}
        />

        {/* Hamburger menu for mobile - only visible when sidebar is closed */}
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
          {renderContent()}
        </main>
      </div>
    </AuthWrapper>
  );
}

export default App;
