import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Overview from './components/pages/Overview';
import Analytics from './components/pages/Analytics';
import MemberEngagement from './components/pages/MemberEngagement';
import MemberRetention from './components/pages/MemberRetention';
import AdvisorPerformance from './components/pages/AdvisorPerformance';
import TechStack from './components/pages/TechStack';
import Roadmap from './components/pages/Roadmap';
import RoadVisualizerWithFilters from './components/pages/RoadVisualizerWithFilters';
import QuickLinks from './components/pages/QuickLinks';
import RoadmapPresentation from './components/pages/RoadmapPresentation';
import Projects from './components/pages/Projects';
import Compliance from './components/pages/Compliance';
import ComplianceCommandCenter from './components/pages/ComplianceCommandCenter';
import ComplianceIncidents from './components/pages/ComplianceIncidents';
import ComplianceBAAs from './components/pages/ComplianceBAAs';
import CompliancePHIAccess from './components/pages/CompliancePHIAccess';
import ComplianceAdministration from './components/pages/ComplianceAdministration';
import ComplianceTraining from './components/pages/ComplianceTraining';
import ComplianceTechnicalSafeguards from './components/pages/ComplianceTechnicalSafeguards';
import ComplianceAudits from './components/pages/ComplianceAudits';
import ComplianceTemplatesTools from './components/pages/ComplianceTemplatesTools';
import SaaSSpend from './components/pages/SaaSSpend';
import AIAgents from './components/pages/AIAgents';
import Deployments from './components/pages/Deployments';
import APIStatus from './components/pages/APIStatus';
import SystemUptime from './components/pages/SystemUptime';
import IntegrationsHub from './components/pages/IntegrationsHub';
import AuthWrapper from './components/pages/AuthWrapper';
import Notepad from './components/pages/Notepad';
import MondayTasks from './components/pages/MondayTasks';
import EmployeePerformance from './components/pages/EmployeePerformance';
import PerformanceEvaluation from './components/pages/PerformanceEvaluation';
import OrganizationalStructure from './components/pages/OrganizationalStructure';
import PolicyManagement from './components/pages/PolicyManagement';
import MarketingAnalytics from './components/pages/MarketingAnalytics';
import Assignments from './components/pages/Assignments';
import EmployeeDocumentStorage from './components/pages/EmployeeDocumentStorage';
import ITSupport from './components/pages/ITSupport';

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
        return <ComplianceCommandCenter onTabChange={setActiveTab} />;
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
