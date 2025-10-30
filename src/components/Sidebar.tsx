import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useCurrentProfile } from '../hooks/useDualDashboard';
import { useAuth } from '../contexts/AuthContext';
import { getNavigationForRole, categories, type NavItem } from '../config/navigation';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSidebarExpanded?: boolean;
  onSidebarToggle?: () => void;
}


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
  const { signOut, isDemoMode } = useAuth();

  const isCEO = profile?.role === 'ceo';
  const userRole = profile?.role || 'staff';

  const menuItems = useMemo(() => {
    return getNavigationForRole(userRole as 'ceo' | 'cto' | 'admin' | 'staff');
  }, [userRole]);

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
  }, [location.pathname, menuItems]);

  const groupedItems = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, NavItem[]>);
  }, [menuItems]);

  const handleLogout = async () => {
    try {
      await signOut();
      if (!isDemoMode) {
        window.location.href = '/login';
      }
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
