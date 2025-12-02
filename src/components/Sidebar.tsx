import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Settings
} from 'lucide-react';
import { useCurrentProfile } from '../hooks/useDualDashboard';
import { useAuth } from '../contexts/AuthContext';
import { getNavigationForRole, ceoNavigationItems, ctoNavigationItems, categories, type NavItem } from '../config/navigation';

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
  const { signOut, isDemoMode } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['compliance', 'department-reporting']);
  const { data: profile } = useCurrentProfile();
  
  // Touch/swipe gesture state
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Admin role-switcher state
  const [adminViewMode, setAdminViewMode] = useState<'ceo' | 'cto'>('ceo');

  const isAdmin = profile?.role === 'admin';
  const isCEO = profile?.role === 'ceo' || (isAdmin && adminViewMode === 'ceo');
  const userRole = profile?.role || 'staff';

  // For admin users, use the view mode to determine navigation
  const menuItems = useMemo(() => {
    if (isAdmin) {
      return adminViewMode === 'ceo' ? ceoNavigationItems : ctoNavigationItems;
    }
    return getNavigationForRole(userRole as 'ceo' | 'cto' | 'admin' | 'staff');
  }, [userRole, isAdmin, adminViewMode]);

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

  // Swipe gesture handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isSidebarExpanded) return;
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, [isMobile, isSidebarExpanded]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    // Only allow dragging left (negative values)
    if (diff < 0) {
      setDragOffset(diff);
    }
  }, [isDragging, isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const diff = touchCurrentX.current - touchStartX.current;
    // If dragged more than 100px to the left, close the sidebar
    if (diff < -100) {
      onSidebarToggle?.();
    }
    setDragOffset(0);
  }, [isDragging, onSidebarToggle]);

  // Handle overlay touch to close
  const handleOverlayTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleOverlayTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    // Swipe right on overlay also closes
    if (Math.abs(diff) < 10) {
      // It's a tap, close immediately
      onSidebarToggle?.();
    }
  }, [onSidebarToggle]);

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
      navigate('/login');
    }
  };

  const handleNavigation = (path: string, tabId: string) => {
    navigate(path);
    onTabChange(tabId);
    if (isMobile) {
      onSidebarToggle?.();
    }
  };

  const isActiveRoute = (itemPath: string, itemId: string, submenu?: Array<{ id: string; path: string }>) => {
    const currentPath = location.pathname;

    if (currentPath === itemPath || currentPath.startsWith(itemPath + '/')) {
      return true;
    }

    if (submenu) {
      return submenu.some(sub =>
        currentPath === sub.path || currentPath.startsWith(sub.path + '/')
      );
    }

    return activeTab === itemId || (submenu && submenu.some((sub) => activeTab === sub.id));
  };

  // Calculate transform for drag gesture
  const sidebarTransform = isDragging && isMobile 
    ? `translateX(${Math.max(dragOffset, -320)}px)` 
    : undefined;

  return (
    <>
      {/* Mobile overlay with backdrop blur */}
      {isMobile && isSidebarExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ease-out"
          onClick={onSidebarToggle}
          onTouchStart={handleOverlayTouchStart}
          onTouchEnd={handleOverlayTouchEnd}
          style={{ pointerEvents: 'auto' }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          ${isCEO ? 'bg-gradient-to-b from-indigo-600 to-indigo-700' : 'bg-slate-900'} 
          text-white h-screen flex flex-col overflow-y-auto overflow-x-hidden
          fixed top-0 left-0 z-40 shadow-2xl
          transition-transform duration-300 ease-out
          ${isSidebarExpanded ? 'w-80' : 'w-20'}
          ${isMobile && !isSidebarExpanded ? '-translate-x-full' : 'translate-x-0'}
          ${isMobile ? 'touch-pan-y' : ''}
          will-change-transform
        `}
        style={{
          transform: sidebarTransform,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Mobile close button */}
        <button
          className={`
            absolute top-4 -right-14 p-3 rounded-full 
            ${isCEO ? 'bg-indigo-600' : 'bg-slate-800'} 
            text-white md:hidden z-50 
            shadow-lg active:scale-95 transition-transform
            touch-manipulation
          `}
          style={{ pointerEvents: 'auto', zIndex: 60 }}
          onClick={onSidebarToggle}
          aria-label={isSidebarExpanded ? 'Close menu' : 'Open menu'}
        >
          {isSidebarExpanded ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop toggle button */}
        <button
          className={`
            hidden md:flex items-center justify-center
            absolute top-6 right-0 transform translate-x-1/2 
            w-8 h-8 rounded-full 
            ${isCEO ? 'bg-indigo-800 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-700'} 
            text-white z-50 cursor-pointer
            transition-all duration-200 hover:scale-110
          `}
          style={{ pointerEvents: 'auto', zIndex: 60 }}
          onClick={onSidebarToggle}
          aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarExpanded ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
        </button>

        <div 
          className={`${isSidebarExpanded ? 'p-4 md:p-6' : 'p-3 md:p-4'} flex-1 flex flex-col relative z-50`} 
          style={{ 
            pointerEvents: 'auto',
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
          }}
        >
          {/* Header */}
          <div className="mb-6 md:mb-8 sidebar-section" style={{ pointerEvents: 'auto' }}>
            <div 
              className={`flex items-center ${isSidebarExpanded ? 'space-x-3' : 'justify-center'}`} 
              style={{ pointerEvents: 'auto' }}
            >
              <div 
                className={`
                  ${isSidebarExpanded ? 'w-12 h-12' : 'w-10 h-10'} 
                  rounded-xl flex items-center justify-center shadow-lg 
                  cursor-pointer bg-white p-1.5
                  active:scale-95 transition-transform touch-manipulation
                `} 
                style={{ pointerEvents: 'auto' }}
              >
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
            
            {/* Admin Role Switcher */}
            {isAdmin && isSidebarExpanded && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg">
                <p className="text-xs text-white/70 mb-2 font-medium">Admin View Mode</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setAdminViewMode('ceo');
                      navigate('/ceod/home');
                    }}
                    className={`
                      flex-1 px-3 py-2.5 rounded-lg text-xs font-medium 
                      transition-all duration-200 touch-manipulation
                      active:scale-95 min-h-[44px]
                      ${adminViewMode === 'ceo'
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }
                    `}
                  >
                    CEO View
                  </button>
                  <button
                    onClick={() => {
                      setAdminViewMode('cto');
                      navigate('/ctod/home');
                    }}
                    className={`
                      flex-1 px-3 py-2.5 rounded-lg text-xs font-medium 
                      transition-all duration-200 touch-manipulation
                      active:scale-95 min-h-[44px]
                      ${adminViewMode === 'cto'
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }
                    `}
                  >
                    CTO View
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav 
            className="flex-1 space-y-4 md:space-y-6 overflow-y-auto overscroll-contain" 
            style={{ pointerEvents: 'auto', zIndex: 50 }}
          >
            {Object.entries(groupedItems).map(([category, items]) => (
              <div 
                key={category} 
                className="sidebar-category" 
                style={{ position: 'relative', zIndex: 51, pointerEvents: 'auto' }}
              >
                {isSidebarExpanded && (
                  <h3 className={`
                    text-xs font-semibold uppercase tracking-wider mb-2 md:mb-3 px-2
                    ${isCEO ? 'text-indigo-200' : 'text-slate-400'}
                  `}>
                    {categories[category]}
                  </h3>
                )}
                <ul className="space-y-1" style={{ position: 'relative', zIndex: 52, pointerEvents: 'auto' }}>
                  {items.map((item: NavItem) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.path, item.id, item.submenu);
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isExpanded = expandedMenus.includes(item.id);

                    return (
                      <li 
                        key={item.id} 
                        className={`${!isSidebarExpanded ? 'flex justify-center' : ''} sidebar-menu-item`} 
                        style={{ pointerEvents: 'auto', zIndex: 53, position: 'relative' }}
                      >
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
                          aria-expanded={hasSubmenu ? isExpanded : undefined}
                          title={item.label}
                          className={`
                            flex items-center space-x-3 px-3 py-3 md:py-2.5 
                            rounded-lg transition-all duration-200 
                            group text-left w-full cursor-pointer 
                            sidebar-btn touch-manipulation
                            active:scale-[0.98] min-h-[44px]
                            ${isActive && !hasSubmenu
                              ? isCEO 
                                ? 'bg-indigo-900 font-semibold shadow-lg text-white' 
                                : 'bg-indigo-600 font-semibold shadow-lg shadow-indigo-500/25 text-white'
                              : isCEO 
                                ? 'text-indigo-50 hover:bg-indigo-800 hover:text-white active:bg-indigo-900' 
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-700'
                            } 
                            ${!isSidebarExpanded && 'justify-center'}
                          `}
                          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 55 }}
                        >
                          <Icon className={`
                            w-5 h-5 md:w-4 md:h-4 flex-shrink-0
                            transition-transform duration-200 sidebar-icon 
                            ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                          `} />
                          {isSidebarExpanded && (
                            <>
                              <span className="text-sm font-medium flex-1">{item.label}</span>
                              {hasSubmenu && (
                                <svg
                                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
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
                          <ul className={`
                            ml-4 mt-1 space-y-0.5 border-l pl-3
                            ${isCEO ? 'border-indigo-800' : 'border-slate-700'}
                          `}>
                            {item.submenu.map((subItem) => {
                              const isSubActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/');
                              return (
                                <li key={subItem.id}>
                                  <button
                                    onClick={() => handleNavigation(subItem.path, subItem.id)}
                                    className={`
                                      flex items-center px-3 py-2.5 md:py-2 
                                      rounded-lg text-sm transition-all duration-200 
                                      w-full text-left touch-manipulation
                                      active:scale-[0.98] min-h-[40px]
                                      ${isSubActive
                                        ? isCEO 
                                          ? 'bg-indigo-900 font-semibold text-white' 
                                          : 'bg-indigo-600 font-semibold text-white'
                                        : isCEO 
                                          ? 'text-indigo-100 hover:bg-indigo-800 hover:text-white active:bg-indigo-900' 
                                          : 'text-slate-400 hover:bg-slate-800 hover:text-white active:bg-slate-700'
                                      }
                                    `}
                                    style={{ pointerEvents: 'auto' }}
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

          {/* User Profile Section */}
          <div 
            className="mt-auto pt-4 md:pt-6 border-t border-white/10" 
            style={{ pointerEvents: 'auto', zIndex: 50 }}
          >
            {/* User Info */}
            <div 
              className={`
                flex items-center ${isSidebarExpanded ? 'space-x-3 p-3' : 'justify-center p-2'} 
                rounded-lg transition-colors cursor-pointer mb-2
                ${isCEO ? 'hover:bg-indigo-800 active:bg-indigo-900' : 'hover:bg-slate-800 active:bg-slate-700'}
                touch-manipulation min-h-[56px]
              `} 
              style={{ pointerEvents: 'auto' }}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0
                ${isCEO ? 'bg-indigo-300 text-indigo-900' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}
              `}>
                <span className={`text-sm font-bold ${isCEO ? 'text-indigo-900' : 'text-white'}`}>
                  {profile?.display_name 
                    ? profile.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                    : (isCEO ? 'CEO' : 'CTO')
                  }
                </span>
              </div>
              {isSidebarExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {profile?.display_name || profile?.full_name || 'User'}
                  </p>
                  <p className={`text-xs truncate ${isCEO ? 'text-indigo-100' : 'text-slate-300'}`}>
                    {profile?.role === 'ceo' 
                      ? 'Chief Executive Officer' 
                      : profile?.role === 'cto' 
                        ? 'Chief Technology Officer' 
                        : profile?.role === 'admin' 
                          ? 'Administrator' 
                          : 'Staff Member'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => navigate(isCEO ? '/ceod/settings' : '/ctod/settings')}
              className={`
                flex items-center ${isSidebarExpanded ? 'space-x-3 px-3' : 'justify-center'} 
                py-3 md:py-2.5 rounded-lg transition-all duration-200 
                group w-full cursor-pointer mb-1
                touch-manipulation active:scale-[0.98] min-h-[44px]
                ${isCEO ? 'text-indigo-100 hover:bg-indigo-800 active:bg-indigo-900' : 'text-slate-400 hover:bg-slate-700 active:bg-slate-600'} 
                hover:text-white
              `}
              style={{ pointerEvents: 'auto', zIndex: 56 }}
              title="Account Settings"
            >
              <Settings className="w-5 h-5 md:w-4 md:h-4 transition-transform duration-200 group-hover:scale-105 flex-shrink-0" />
              {isSidebarExpanded && <span className="text-sm font-medium">Settings</span>}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`
                flex items-center ${isSidebarExpanded ? 'space-x-3 px-3' : 'justify-center'} 
                py-3 md:py-2.5 rounded-lg transition-all duration-200 
                group w-full cursor-pointer
                touch-manipulation active:scale-[0.98] min-h-[44px]
                ${isCEO ? 'text-indigo-100' : 'text-slate-400'} 
                hover:bg-red-600 hover:text-white active:bg-red-700
              `}
              style={{ pointerEvents: 'auto', zIndex: 56 }}
            >
              <LogOut className="w-5 h-5 md:w-4 md:h-4 transition-transform duration-200 group-hover:scale-105 flex-shrink-0" />
              {isSidebarExpanded && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
