import { useState, useEffect } from 'react';
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
  Ticket
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSidebarExpanded?: boolean;
  onSidebarToggle?: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Building2, category: 'main' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'analytics' },
  { id: 'member-engagement', label: 'Member Engagement', icon: Users, category: 'analytics' },
  { id: 'member-retention', label: 'Member Retention', icon: TrendingDown, category: 'analytics' },
  { id: 'advisor-performance', label: 'Advisor Performance', icon: Award, category: 'analytics' },
  { id: 'marketing-analytics', label: 'Marketing Analytics', icon: LineChart, category: 'analytics' },
  { id: 'tech-stack', label: 'Tech Stack', icon: Code2, category: 'development' },
  { id: 'quick-links', label: 'QuickLinks Directory', icon: Link2, category: 'development' },
  { id: 'roadmap', label: 'Roadmap', icon: Calendar, category: 'development' },
  { id: 'road-visualizer', label: 'Roadmap Visualizer', icon: Map, category: 'development' },
  { id: 'roadmap-presentation', label: 'Roadmap Presentation', icon: Presentation, category: 'development' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, category: 'development' },
  { id: 'monday-tasks', label: 'Monday Tasks', icon: Zap, category: 'development' },
  { id: 'assignments', label: 'Assignments', icon: CheckSquare, category: 'development' },
  { id: 'notepad', label: 'Notepad', icon: StickyNote, category: 'development' },
  {
    id: 'compliance',
    label: 'Compliance Command Center',
    icon: ShieldCheck,
    category: 'operations',
    submenu: [
      { id: 'compliance/command-center', label: 'Dashboard' },
      { id: 'compliance/administration', label: 'Administration & Governance' },
      { id: 'compliance/training', label: 'Training & Awareness' },
      { id: 'compliance/phi-minimum', label: 'PHI & Minimum Necessary' },
      { id: 'compliance/technical-safeguards', label: 'Technical Safeguards' },
      { id: 'compliance/baas', label: 'Business Associates' },
      { id: 'compliance/incidents', label: 'Incidents & Breaches' },
      { id: 'compliance/audits', label: 'Audits & Monitoring' },
      { id: 'compliance/templates-tools', label: 'Templates & Tools' },
      { id: 'compliance/employee-documents', label: 'Employee Documents' },
    ]
  },
  { id: 'saas', label: 'SaaS Spend', icon: Database, category: 'operations' },
  { id: 'ai-agents', label: 'AI Agents', icon: Cpu, category: 'operations' },
  { id: 'it-support', label: 'IT Support Tickets', icon: Ticket, category: 'operations' },
  { id: 'integrations', label: 'Integrations Hub', icon: Settings, category: 'operations' },
  { id: 'deployments', label: 'Deployments', icon: UploadCloud, category: 'infrastructure' },
  { id: 'policy-management', label: 'Policy Manager', icon: FileText, category: 'operations' },
  { id: 'employee-performance', label: 'Employee Performance', icon: ClipboardCheck, category: 'operations' },
  { id: 'api-status', label: 'API Status', icon: Activity, category: 'infrastructure' },
  { id: 'system-uptime', label: 'System Uptime', icon: Server, category: 'infrastructure' },
  { id: 'performance-evaluation', label: 'Performance Evaluation', icon: UserSquare2, category: 'operations' },
  { id: 'organizational-structure', label: 'Organization', icon: GitBranch, category: 'operations' },
];

const categories = {
  main: 'Dashboard',
  analytics: 'Analytics & Insights',
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
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['compliance']);
  
  // Detect if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
     <div 
       className={`bg-slate-900 text-white h-screen flex flex-col overflow-y-auto fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out shadow-2xl ${
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
       className="absolute top-4 -right-12 p-2 rounded-full bg-sky-600 text-white md:hidden z-50 cursor-pointer"
       style={{pointerEvents: 'auto', zIndex: 60}}
        onClick={onSidebarToggle}
      >
        {isSidebarExpanded ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      
      {/* Desktop toggle button - only visible on desktop */}
     <button
       className="hidden md:block absolute top-6 right-0 transform translate-x-1/2 p-1 rounded-full bg-slate-800 text-white z-50 cursor-pointer" 
       style={{pointerEvents: 'auto', zIndex: 60}}
        onClick={onSidebarToggle}
      >
        {isSidebarExpanded ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
      </button>
      
     <div className={`${isSidebarExpanded ? 'p-6' : 'p-4'} flex-1 flex flex-col relative z-50 bg-slate-900`} style={{pointerEvents: 'auto'}}>
        {/* Header */}
       <div className="mb-8 sidebar-section bg-slate-900" style={{pointerEvents: 'auto'}}>
         <div className={`flex items-center ${isSidebarExpanded ? 'space-x-3' : 'justify-center'}`} style={{pointerEvents: 'auto'}}>
           <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer" style={{pointerEvents: 'auto'}}>
             <Building2 className="w-7 h-7 text-white" />
            </div>
            {isSidebarExpanded && (
              <div>
                <h1 className="text-xl font-bold text-white">MPB Health</h1>
                <p className="text-slate-300 text-sm font-medium">CTO Dashboard</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Menu */}
       <nav className="flex-1 space-y-6 overflow-y-auto bg-slate-900" style={{pointerEvents: 'auto', zIndex: 50}}>
          {Object.entries(groupedItems).map(([category, items]) => (
           <div key={category} className="sidebar-category bg-slate-900" style={{position: 'relative', zIndex: 51, pointerEvents: 'auto'}}>
              {isSidebarExpanded && (
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                  {categories[category]}
                </h3>
              )}
             <ul className="space-y-1" style={{position: 'relative', zIndex: 52, pointerEvents: 'auto'}}>
                {items.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.submenu && item.submenu.some((sub: any) => activeTab === sub.id));
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
                            onTabChange(item.id);
                            if (isMobile) {
                              onSidebarToggle?.();
                            }
                          }
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        title={item.label}
                       className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-left w-full cursor-pointer sidebar-btn ${
                          isActive && !hasSubmenu
                            ? 'bg-sky-600 font-semibold shadow-lg shadow-sky-500/25 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
                        <ul className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-3">
                          {item.submenu.map((subItem: any) => {
                            const isSubActive = activeTab === subItem.id;
                            return (
                              <li key={subItem.id}>
                                <button
                                  onClick={() => {
                                    onTabChange(subItem.id);
                                    if (isMobile) {
                                      onSidebarToggle?.();
                                    }
                                  }}
                                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 w-full text-left ${
                                    isSubActive
                                      ? 'bg-sky-600 font-semibold text-white'
                                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
       <div className="mt-auto pt-6 bg-slate-900" style={{pointerEvents: 'auto', zIndex: 50}}>
         <div className={`flex items-center ${isSidebarExpanded ? 'space-x-3 p-3' : 'justify-center p-2'} rounded-lg hover:bg-slate-800 transition-colors cursor-pointer mb-3 bg-slate-900`} style={{pointerEvents: 'auto'}}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">VT</span>
            </div>
            {isSidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">Vinnie R. Tannous</p>
                <p className="text-xs text-slate-300 truncate">Chief Technology Officer</p>
              </div>
            )}
          </div>
          {/* Logout Button */}
          <button
            onClick={handleLogout} 
           className={`flex items-center ${isSidebarExpanded ? 'space-x-3 px-3' : 'justify-center'} py-2.5 rounded-lg transition-all duration-200 text-slate-400 hover:bg-red-600 hover:text-white group w-full cursor-pointer`}
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
