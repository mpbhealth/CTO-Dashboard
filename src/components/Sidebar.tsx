import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrentProfile } from '../hooks/useDualDashboard';
import { useAuth } from '../contexts/AuthContext';
import { 
  useSidebar, 
  useExpandedMenus, 
  useFocusTrap, 
  useBodyScrollLock,
  SIDEBAR_CONSTANTS 
} from '../hooks/useSidebar';
import { 
  getNavigationForRole, 
  ceoNavigationItems, 
  ctoNavigationItems, 
  categories, 
  type NavItem 
} from '../config/navigation';
import { NotificationBell } from './notifications';
import { cn } from '../lib/utils';
import {
  SidebarOverlay,
  SidebarToggleButton,
  SidebarHeader,
  SidebarUserProfile,
  AdminRoleSwitcher,
  SidebarNavItem,
  SidebarCategoryHeader,
} from './sidebar/index';

// ============================================================================
// TYPES
// ============================================================================

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSidebarExpanded?: boolean;
  onSidebarToggle?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function SidebarComponent({
  activeTab,
  onTabChange,
  isSidebarExpanded: externalExpanded,
  onSidebarToggle: externalToggle,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { data: profile } = useCurrentProfile();

  // Admin role-switcher state
  const [adminViewMode, setAdminViewMode] = useState<'ceo' | 'cto'>('ceo');

  // Derived role states
  const isAdmin = profile?.role === 'admin';
  const isCEO = useMemo(() => 
    ['ceo', 'cfo', 'cmo'].includes(profile?.role || '') || (isAdmin && adminViewMode === 'ceo'),
    [profile?.role, isAdmin, adminViewMode]
  );
  const userRole = profile?.role || 'staff';
  const theme = isCEO ? 'ceo' : 'cto';

  // Use external state if provided, otherwise use internal
  const isControlled = externalExpanded !== undefined && externalToggle !== undefined;
  
  // Internal sidebar state (for uncontrolled mode)
  const internalSidebar = useSidebar({
    initialExpanded: true,
    storageKey: 'sidebar-expanded',
  });

  // Use controlled or uncontrolled state
  const isExpanded = isControlled ? externalExpanded : internalSidebar.isExpanded;
  const isMobile = internalSidebar.isMobile;
  const sidebarRef = internalSidebar.sidebarRef;
  
  const toggle = useCallback(() => {
    if (isControlled) {
      externalToggle();
    } else {
      internalSidebar.toggle();
    }
  }, [isControlled, externalToggle, internalSidebar]);

  // Touch handlers
  const handleTouchStart = internalSidebar.handleTouchStart;
  const handleTouchMove = internalSidebar.handleTouchMove;
  const handleTouchEnd = internalSidebar.handleTouchEnd;

  // Menu expansion state
  const expandedMenusState = useExpandedMenus(['compliance', 'department-reporting']);

  // Focus trap for mobile
  useFocusTrap(isMobile && isExpanded, sidebarRef);

  // Body scroll lock for mobile
  useBodyScrollLock(isMobile && isExpanded);

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleEscape = () => {
      if (isMobile && isExpanded) {
        toggle();
      }
    };

    const currentRef = sidebarRef.current;
    currentRef?.addEventListener('sidebar-escape', handleEscape);
    return () => {
      currentRef?.removeEventListener('sidebar-escape', handleEscape);
    };
  }, [isMobile, isExpanded, toggle, sidebarRef]);

  // Get navigation items based on role
  const menuItems = useMemo(() => {
    if (isAdmin) {
      return adminViewMode === 'ceo' ? ceoNavigationItems : ctoNavigationItems;
    }
    return getNavigationForRole(userRole);
  }, [userRole, isAdmin, adminViewMode]);

  // Group items by category
  const groupedItems = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, NavItem[]>);
  }, [menuItems]);

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
      newExpandedMenus.forEach(menuId => {
        expandedMenusState.expandMenu(menuId);
      });
    }
  }, [location.pathname, menuItems, expandedMenusState]);

  // Handlers
  const handleLogout = useCallback(async () => {
    try {
      sessionStorage.removeItem('mpb_access_verified');
      await signOut();
      // signOut now handles the redirect internally
    } catch (error) {
      console.error('Error logging out:', error);
      // Fallback navigation if signOut fails
      window.location.href = '/login';
    }
  }, [signOut]);

  const handleNavigation = useCallback((path: string, tabId: string) => {
    navigate(path);
    onTabChange(tabId);
    if (isMobile) {
      toggle();
    }
  }, [navigate, onTabChange, isMobile, toggle]);

  const handleAdminModeChange = useCallback((mode: 'ceo' | 'cto') => {
    setAdminViewMode(mode);
    navigate(mode === 'ceo' ? '/ceod/home' : '/ctod/home');
  }, [navigate]);

  const handleSettingsClick = useCallback(() => {
    navigate(isCEO ? '/ceod/settings' : '/ctod/settings');
  }, [navigate, isCEO]);

  // Check if a route is active
  const isActiveRoute = useCallback((itemPath: string, itemId: string, submenu?: Array<{ id: string; path: string }>) => {
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
  }, [location.pathname, activeTab]);

  // Sidebar transform for drag gesture
  const sidebarTransform = internalSidebar.isDragging && isMobile
    ? `translateX(${Math.max(internalSidebar.dragOffset, SIDEBAR_CONSTANTS.MAX_DRAG_OFFSET)}px)`
    : undefined;

  // Get role label for user profile
  const roleLabel = useMemo(() => {
    if (['ceo', 'cfo', 'cmo'].includes(profile?.role || '')) {
      return 'Executive';
    }
    if (profile?.role === 'cto') {
      return 'Chief Technology Officer';
    }
    if (profile?.role === 'admin') {
      return 'Administrator';
    }
    return 'Staff Member';
  }, [profile?.role]);

  return (
    <>
      {/* Mobile overlay */}
      <SidebarOverlay
        isVisible={isMobile && isExpanded}
        onClose={toggle}
        onTouchStart={(e) => {
          internalSidebar.sidebarRef.current && handleTouchStart(e);
        }}
        onTouchEnd={() => toggle()}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          // Base styles
          'text-white h-screen flex flex-col overflow-hidden',
          'fixed inset-y-0 left-0 z-40 shadow-2xl',
          'transition-transform duration-300 ease-out',
          'will-change-transform',
          
          // Theme
          isCEO 
            ? 'bg-gradient-to-b from-indigo-600 to-indigo-700' 
            : 'bg-slate-900',
          
          // Width - responsive for all screen sizes
          // Mobile: full width minus some margin, max 320px
          // Desktop: fixed widths
          isExpanded 
            ? 'w-[calc(100vw-3rem)] sm:w-80 max-w-[320px]' 
            : 'w-20',
          
          // Mobile visibility
          isMobile && !isExpanded ? '-translate-x-full' : 'translate-x-0',
          
          // Touch behavior
          isMobile && 'touch-pan-y overscroll-contain'
        )}
        style={{
          // Only apply transform during drag, otherwise let classes handle it
          ...(sidebarTransform ? { transform: sidebarTransform } : {}),
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
        }}
      >
        {/* Mobile toggle button */}
        <SidebarToggleButton
          isExpanded={isExpanded}
          onToggle={toggle}
          variant="mobile"
          theme={theme}
        />

        {/* Desktop toggle button */}
        <SidebarToggleButton
          isExpanded={isExpanded}
          onToggle={toggle}
          variant="desktop"
          theme={theme}
        />

        {/* Main content container */}
        <div
          className={cn(
            'flex-1 flex flex-col overflow-hidden relative z-50',
            // Responsive padding - tighter on small screens
            isExpanded ? 'p-3 sm:p-4 md:p-6' : 'p-2 sm:p-3 md:p-4'
          )}
          style={{
            // Respect safe areas on devices with notches
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          }}
        >
          {/* Header */}
          <SidebarHeader
            isExpanded={isExpanded}
            title="MPB Health"
            subtitle={isCEO ? 'CEO Dashboard' : 'CTO Dashboard'}
            logoSrc="/MPB-Health-No-background.png"
            logoAlt="MPB Health Logo"
            theme={theme}
          >
            {/* Notification Bell */}
            {isExpanded && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex-1" />
                <NotificationBell className="text-white [&_svg]:text-white [&_svg:hover]:text-slate-200 [&_button]:hover:bg-white/10" />
              </div>
            )}

            {/* Admin Role Switcher */}
            {isAdmin && (
              <AdminRoleSwitcher
                isExpanded={isExpanded}
                activeMode={adminViewMode}
                onModeChange={handleAdminModeChange}
              />
            )}
          </SidebarHeader>

          {/* Navigation */}
          <nav
            className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent -webkit-overflow-scrolling-touch"
            aria-label="Sidebar navigation"
          >
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="sidebar-category">
                <SidebarCategoryHeader
                  title={categories[category]}
                  isExpanded={isExpanded}
                  theme={theme}
                />
                
                <ul className="space-y-1">
                  {items.map((item: NavItem, index: number) => (
                    <SidebarNavItem
                      key={item.id}
                      item={{
                        id: item.id,
                        label: item.label,
                        path: item.path,
                        icon: item.icon,
                        badge: item.badge,
                        submenu: item.submenu,
                      }}
                      isActive={isActiveRoute(item.path, item.id, item.submenu)}
                      isExpanded={expandedMenusState.isMenuExpanded(item.id)}
                      sidebarExpanded={isExpanded}
                      onNavigate={handleNavigation}
                      onToggleSubmenu={expandedMenusState.toggleMenu}
                      theme={theme}
                      itemIndex={index}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* User Profile Section */}
          <SidebarUserProfile
            profile={profile}
            isExpanded={isExpanded}
            onSettingsClick={handleSettingsClick}
            onLogout={handleLogout}
            theme={theme}
            roleLabel={roleLabel}
          />
        </div>
      </aside>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders
const Sidebar = memo(SidebarComponent);

export default Sidebar;
