import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Code2,
  UserSquare2,
  Calendar,
  FolderKanban,
  ShieldCheck,
  Database,
  Cpu,
  UploadCloud,
  Activity,
  Building2,
  BarChart3,
  Users,
  TrendingDown,
  Award,
  Server,
  GitBranch,
  Map,
  Settings,
  LogOut,
  Presentation,
  StickyNote,
  Zap,
  FileText,
  LineChart,
  Menu,
  X,
  ChevronsLeft,
  Link2,
  ChevronsRight,
  CheckSquare,
  ClipboardCheck,
  Ticket,
  FolderUp,
  MessageSquare,
  ShoppingCart,
  DollarSign,
  Headphones
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDashboardContext } from '../hooks/useDashboardContext';
import { useCurrentProfile } from '../hooks/useDualDashboard';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSidebarExpanded?: boolean;
  onSidebarToggle?: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Building2, category: 'main', path: '/ctod/home' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'analytics', path: '/ceod/analytics/overview' },
  { id: 'member-engagement', label: 'Member Engagement', icon: Users, category: 'analytics', path: '/ceod/analytics/member-engagement' },
  { id: 'member-retention', label: 'Member Retention', icon: TrendingDown, category: 'analytics', path: '/ceod/analytics/member-retention' },
  { id: 'advisor-performance', label: 'Advisor Performance', icon: Award, category: 'analytics', path: '/ceod/analytics/advisor-performance' },
  { id: 'marketing-analytics', label: 'Marketing Analytics', icon: LineChart, category: 'analytics', path: '/ceod/analytics/marketing' },
  {
    id: 'department-reporting',
    label: 'Department Reporting',
    icon: FolderUp,
    category: 'reporting',
    path: '/ceod/data',
    submenu: [
      { id: 'department-reporting/concierge', label: 'Concierge', path: '/ceod/departments/concierge' },
      { id: 'department-reporting/sales', label: 'Sales', path: '/ceod/departments/sales' },
      { id: 'department-reporting/operations', label: 'Operations', path: '/ceod/departments/operations' },
      { id: 'department-reporting/finance', label: 'Finance', path: '/ceod/departments/finance' },
      { id: 'department-reporting/saudemax', label: 'SaudeMAX', path: '/ceod/departments/saudemax' },
    ]
  },
  { id: 'tech-stack', label: 'Tech Stack', icon: Code2, category: 'development', path: '/tech-stack' },
  { id: 'quick-links', label: 'QuickLinks Directory', icon: Link2, category: 'development', path: '/quick-links' },
  { id: 'roadmap', label: 'Roadmap', icon: Calendar, category: 'development', path: '/roadmap' },
  { id: 'road-visualizer', label: 'Roadmap Visualizer', icon: Map, category: 'development', path: '/road-visualizer' },
  { id: 'roadmap-presentation', label: 'Roadmap Presentation', icon: Presentation, category: 'development', path: '/roadmap-presentation' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, category: 'development', path: '/projects' },
  { id: 'monday-tasks', label: 'Monday Tasks', icon: Zap, category: 'development', path: '/monday-tasks' },
  { id: 'assignments', label: 'Assignments', icon: CheckSquare, category: 'development', path: '/assignments' },
  { id: 'notepad', label: 'Notepad', icon: StickyNote, category: 'development', path: '/notepad' },
  {
    id: 'compliance',
    label: 'Compliance Command Center',
    icon: ShieldCheck,
    category: 'operations',
    path: '/ctod/compliance/dashboard',
    submenu: [
      { id: 'compliance/command-center', label: 'Dashboard', path: '/ctod/compliance/dashboard' },
      { id: 'compliance/administration', label: 'Administration & Governance', path: '/ctod/compliance/administration' },
      { id: 'compliance/training', label: 'Training & Awareness', path: '/ctod/compliance/training' },
      { id: 'compliance/phi-minimum', label: 'PHI & Minimum Necessary', path: '/ctod/compliance/phi-minimum' },
      { id: 'compliance/technical-safeguards', label: 'Technical Safeguards', path: '/ctod/compliance/technical-safeguards' },
      { id: 'compliance/baas', label: 'Business Associates', path: '/ctod/compliance/baas' },
      { id: 'compliance/incidents', label: 'Incidents & Breaches', path: '/ctod/compliance/incidents' },
      { id: 'compliance/audits', label: 'Audits & Monitoring', path: '/ctod/compliance/audits' },
      { id: 'compliance/templates-tools', label: 'Templates & Tools', path: '/ctod/compliance/templates-tools' },
      { id: 'compliance/employee-documents', label: 'Employee Documents', path: '/ctod/compliance/employee-documents' },
    ]
  },
  { id: 'saas', label: 'SaaS Spend', icon: Database, category: 'operations', path: '/shared/saas' },
  { id: 'ai-agents', label: 'AI Agents', icon: Cpu, category: 'operations', path: '/shared/ai-agents' },
  { id: 'it-support', label: 'IT Support Tickets', icon: Ticket, category: 'operations', path: '/shared/it-support' },
  { id: 'integrations', label: 'Integrations Hub', icon: Settings, category: 'operations', path: '/shared/integrations' },
  { id: 'deployments', label: 'Deployments', icon: UploadCloud, category: 'infrastructure', path: '/shared/deployments' },
  { id: 'policy-management', label: 'Policy Manager', icon: FileText, category: 'operations', path: '/shared/policy-management' },
  { id: 'employee-performance', label: 'Employee Performance', icon: ClipboardCheck, category: 'operations', path: '/shared/employee-performance' },
  { id: 'api-status', label: 'API Status', icon: Activity, category: 'infrastructure', path: '/shared/api-status' },
  { id: 'system-uptime', label: 'System Uptime', icon: Server, category: 'infrastructure', path: '/shared/system-uptime' },
  { id: 'performance-evaluation', label: 'Performance Evaluation', icon: UserSquare2, category: 'operations', path: '/shared/performance-evaluation' },
  { id: 'organizational-structure', label: 'Organization', icon: GitBranch, category: 'operations', path: '/shared/organizational-structure' },
];

const categories: Record<string, string> = {
  main: 'Dashboard',
  analytics: 'Analytics & Insights',
  reporting: 'Department Reporting',
  development: 'Development & Planning',
  operations: 'Operations & Management',
  infrastructure: 'Infrastructure & Monitoring'
};

export default function Sidebar({
  activeTab,
  onTabChange,
  isSidebarExpanded = true,
  onSidebarToggle
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['compliance', 'department-reporting']);
  const { data: profile } = useCurrentProfile();

  const isCEO = profile?.role === 'ceo' || profile?.role === 'admin';

  // Detect if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Auto-expand menus based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const newExpandedMenus: string[] = [];

    menuItems.forEach(item => {
      if (item.submenu) {
        const hasActiveSubmenu = item.submenu.some(sub =>
          currentPath === sub.path || currentPath.startsWith(sub.path + '/')
        );
        if (hasActiveSubmenu) {
          newExpandedMenus.push(item.id);
        }
      }
    });

    if (newExpandedMenus.length > 0) {
      setExpandedMenus(prev => [...new Set([...prev, ...newExpandedMenus])]);
    }
  }, [location.pathname]);

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
        throw error;
      }
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      window.location.href = '/login';
    }
  };

  const handleNavigation = (path: string, tabId: string) => {
    navigate(path);
    onTabChange(tabId);
    if (isMobile) {
      onSidebarToggle?.();
    }
  };

  const isActiveRoute = (itemPath: string, itemId: string, submenu?: any[]) => {
    const currentPath = location.pathname;

    // Check if current path matches exactly or starts with item path
    if (currentPath === itemPath || currentPath.startsWith(itemPath + '/')) {
      return true;
    }

    // Check submenu items
    if (submenu) {
      return submenu.some(sub =>
        currentPath === sub.path || currentPath.startsWith(sub.path + '/')
      );
    }

    // Fallback to activeTab prop
    return activeTab === itemId || (submenu && submenu.some((sub: any) => activeTab === sub.id));
  };

  return (
     <div
       className={`${isCEO ? 'bg-gradient-to-b from-pink-600 to-pink-700' : 'bg-slate-900'} text-white h-screen flex flex-col overflow-y-auto fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out shadow-2xl ${
        isSidebarExpanded ? 'w-80' : 'w-20'
      } ${isMobile && !isSidebarExpanded ? '-translate-x-full' : 'translate-x-0'}`}
    >
      {/* Mobile overlay */}
     {isMobile && isSidebarExpanded && (
       <div
         className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
         onClick={onSidebarToggle}
         style={{pointerEvents: 'auto'}}
       ></div>
      )}

      {/* Menu toggle button - only visible on mobile */}
     <button
       className={`absolute top-4 -right-12 p-2 rounded-full ${isCEO ? 'bg-pink-600' : 'bg-pink-600'} text-white md:hidden z-50 cursor-pointer`}
       style={{pointerEvents: 'auto', zIndex: 60}}
        onClick={onSidebarToggle}
      >
        {isSidebarExpanded ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop toggle button - only visible on desktop */}
     <button
       className={`hidden md:block absolute top-6 right-0 transform translate-x-1/2 p-1 rounded-full ${isCEO ? 'bg-pink-800' : 'bg-slate-800'} text-white z-50 cursor-pointer`}
       style={{pointerEvents: 'auto', zIndex: 60}}
        onClick={onSidebarToggle}
      >
        {isSidebarExpanded ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
      </button>

     <div className={`${isSidebarExpanded ? 'p-6' : 'p-4'} flex-1 flex flex-col relative z-50`} style={{pointerEvents: 'auto'}}>
        {/* Header */}
       <div className="mb-8 sidebar-section" style={{pointerEvents: 'auto'}}>
         <div className={`flex items-center ${isSidebarExpanded ? 'space-x-3' : 'justify-center'}`} style={{pointerEvents: 'auto'}}>
           <div className={`${isSidebarExpanded ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl flex items-center justify-center shadow-lg cursor-pointer bg-white p-1.5`} style={{pointerEvents: 'auto'}}>
             <img
               src="/MPB-Health-No-background.png"
               alt="MPB Health Logo"
               className="w-full h-full object-contain"
             />
            </div>
            {isSidebarExpanded && (
              <div>
                <h1 className="text-xl font-bold text-white">MPB Health</h1>
                <p className="text-slate-300 text-sm font-medium">
                  {isCEO ? 'CEO Dashboard' : 'CTO Dashboard'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
       <nav className="flex-1 space-y-6 overflow-y-auto" style={{pointerEvents: 'auto', zIndex: 50}}>
          {Object.entries(groupedItems).map(([category, items]) => (
           <div key={category} className="sidebar-category" style={{position: 'relative', zIndex: 51, pointerEvents: 'auto'}}>
              {isSidebarExpanded && (
                <h3 className={`text-xs font-semibold ${isCEO ? 'text-pink-200' : 'text-slate-400'} uppercase tracking-wider mb-3 px-2`}>
                  {categories[category]}
                </h3>
              )}
             <ul className="space-y-1" style={{position: 'relative', zIndex: 52, pointerEvents: 'auto'}}>
                {items.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.path, item.id, item.submenu);
                  const hasSubmenu = item.submenu && item.submenu.length > 0;
                  const isExpanded = expandedMenus.includes(item.id);

                  return (
                   <li key={item.id} className={`${!isSidebarExpanded ? 'flex justify-center' : ''} sidebar-menu-item`} style={{pointerEvents: 'auto', zIndex: 53, position: 'relative'}}>
                      <button
                        onClick={() => {
                          if (hasSubmenu && isSidebarExpanded) {
                            setExpandedMenus(prev =>
                              prev.includes(item.id)
                                ? prev.filter(id => id !== item.id)
                                : [...prev, item.id]
                            );
                          } else {
                            handleNavigation(item.path, item.id);
                          }
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        title={item.label}
                       className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-left w-full cursor-pointer sidebar-btn ${
                          isActive && !hasSubmenu
                            ? isCEO ? 'bg-pink-900 font-semibold shadow-lg text-white' : 'bg-pink-600 font-semibold shadow-lg shadow-pink-500/25 text-white'
                            : isCEO ? 'text-pink-50 hover:bg-pink-800 hover:text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        } ${!isSidebarExpanded && 'justify-center'}`}
                       style={{pointerEvents: 'auto', position: 'relative', zIndex: 55}}
                      >
                       <Icon className={`w-4 h-4 transition-transform duration-200 sidebar-icon ${
                          isActive ? 'scale-110' : 'group-hover:scale-105'
                        }`} />
                        {isSidebarExpanded && (
                          <>
                            <span className="text-sm font-medium flex-1">{item.label}</span>
                            {hasSubmenu && (
                              <svg
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </>
                        )}
                      </button>

                      {/* Submenu */}
                      {hasSubmenu && isExpanded && isSidebarExpanded && (
                        <ul className={`ml-4 mt-1 space-y-1 border-l ${isCEO ? 'border-pink-800' : 'border-slate-700'} pl-3`}>
                          {item.submenu.map((subItem: any) => {
                            const isSubActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/');
                            return (
                              <li key={subItem.id}>
                                <button
                                  onClick={() => handleNavigation(subItem.path, subItem.id)}
                                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 w-full text-left ${
                                    isSubActive
                                      ? isCEO ? 'bg-pink-900 font-semibold text-white' : 'bg-pink-600 font-semibold text-white'
                                      : isCEO ? 'text-pink-100 hover:bg-pink-800 hover:text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                  }`}
                                  style={{pointerEvents: 'auto'}}
                                >
                                  {subItem.label}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Profile */}
       <div className="mt-auto pt-6" style={{pointerEvents: 'auto', zIndex: 50}}>
         <div className={`flex items-center ${isSidebarExpanded ? 'space-x-3 p-3' : 'justify-center p-2'} rounded-lg ${isCEO ? 'hover:bg-pink-800' : 'hover:bg-slate-800'} transition-colors cursor-pointer mb-3`} style={{pointerEvents: 'auto'}}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              isCEO ? 'bg-pink-300 text-pink-900' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
            }`}>
              <span className={`text-sm font-bold ${isCEO ? 'text-pink-900' : 'text-white'}`}>
                {profile?.display_name ? profile.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : (isCEO ? 'CEO' : 'CTO')}
              </span>
            </div>
            {isSidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {profile?.display_name || profile?.full_name || 'User'}
                </p>
                <p className={`text-xs ${isCEO ? 'text-pink-100' : 'text-slate-300'} truncate`}>
                  {profile?.role === 'ceo' ? 'Chief Executive Officer' : profile?.role === 'cto' ? 'Chief Technology Officer' : profile?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </p>
              </div>
            )}
          </div>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
           className={`flex items-center ${isSidebarExpanded ? 'space-x-3 px-3' : 'justify-center'} py-2.5 rounded-lg transition-all duration-200 ${isCEO ? 'text-pink-100' : 'text-slate-400'} hover:bg-red-600 hover:text-white group w-full cursor-pointer`}
           style={{pointerEvents: 'auto', zIndex: 56}}
          >
            <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-105" />
            {isSidebarExpanded && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
