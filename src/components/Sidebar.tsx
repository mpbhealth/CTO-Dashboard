import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrentProfile } from '../hooks/useDualDashboard';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { 
  useSidebar, 
  useExpandedMenus, 
  useFocusTrap, 
  useBodyScrollLock,
  SIDEBAR_CONSTANTS 
} from '../hooks/useSidebar';
import { 
  getNavigationForRole,
  categories, 
  type NavItem 
} from '../config/navigation';
import { NotificationBell } from './notifications';
import { ThemeToggle } from './brand/ThemeToggle';
import { useShell } from './shell/AppShell';
import { cn } from '../lib/utils';
import {
  SidebarOverlay,
  SidebarToggleButton,
  SidebarHeader,
  SidebarUserProfile,
  SidebarNavItem,
  SidebarCategoryHeader,
  SidebarSearchHint,
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
  const { openPalette } = useShell();
  const { data: profile } = useCurrentProfile();
  const { linked } = useOrg();

  const userRole = profile?.role || 'viewer';
  const theme = 'aryx' as const;

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
  const expandedMenusState = useExpandedMenus([]);

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
  const menuItems = useMemo(
    () => getNavigationForRole(userRole, { tickets: linked.tickets, traffic: linked.traffic }),
    [linked.tickets, linked.traffic, userRole],
  );

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

  const handleSettingsClick = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

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

  const roleLabel =
    profile?.role === 'ceo'
      ? 'Chief Executive Officer'
      : profile?.role === 'cto'
      ? 'Chief Technology Officer'
      : profile?.role === 'admin'
      ? 'Administrator'
      : 'Chief Executive Officer';

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
          'h-screen h-[100dvh] flex flex-col overflow-hidden',
          'fixed inset-y-0 left-0',
          'transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
          'will-change-transform text-[#F4F1EA]',

          isMobile ? 'z-[60]' : 'z-40',
          'bg-aryx-void border-r border-white/10',

          isExpanded
            ? 'w-[calc(100vw-3rem)] sm:w-80 max-w-[320px]'
            : 'w-20',

          // Mobile visibility
          isMobile && !isExpanded ? '-translate-x-full' : 'translate-x-0',

          // Desktop collapsed: always visible
          !isMobile && 'translate-x-0',

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
            title="ARYX"
            subtitle="CEO"
            logoSrc="/brand/aryx-mark.png"
            logoAlt="ARYX"
            theme={theme}
          >
            {isExpanded && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <ThemeToggle className="border-white/15 bg-white/5 text-white/70 hover:text-[#F4F1EA]" />
                <NotificationBell className="text-[#F4F1EA] [&_svg]:text-[#F4F1EA] [&_button]:hover:bg-white/10" />
              </div>
            )}
          </SidebarHeader>

          <SidebarSearchHint
            isExpanded={isExpanded}
            shortcut={navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}
            onClick={openPalette}
          />

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
