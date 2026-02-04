import { useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  AlertCircle,
  BookOpen,
  HelpCircle,
  Bell,
  Settings,
  Activity,
  BarChart3,
  Globe,
  TrendingUp,
  Search,
  Shield,
  UserCheck,
  Monitor,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminStats } from './AdminStatsContext';
import {
  useSidebar,
  useExpandedMenus,
  useFocusTrap,
  useBodyScrollLock,
  SIDEBAR_CONSTANTS,
} from '../../hooks/useSidebar';
import {
  SidebarOverlay,
  SidebarToggleButton,
  SidebarUserProfile,
  SidebarSearchHint,
} from '../sidebar/index';
import { cn } from '../../lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  badge?: keyof ReturnType<typeof useAdminStats>['stats'];
  urgent?: boolean;
  submenu?: SubNavItem[];
}

interface SubNavItem {
  id: string;
  label: string;
  path: string;
  badge?: keyof ReturnType<typeof useAdminStats>['stats'];
  urgent?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

const navigationGroups: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { id: 'live', label: 'Live View', icon: Activity, path: '/admin/live' },
      { id: 'analytics', label: 'Analytics Overview', icon: BarChart3, path: '/admin/analytics' },
      { id: 'traffic', label: 'Traffic Sources', icon: Globe, path: '/admin/traffic' },
      { id: 'marketing', label: 'Marketing Analytics', icon: TrendingUp, path: '/admin/marketing' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'members', label: 'Member Management', icon: Users, path: '/admin/members', badge: 'total_members' },
      { id: 'claims', label: 'Claims Processing', icon: FileText, path: '/admin/claims', badge: 'pending_claims', urgent: true },
      { id: 'transactions', label: 'Transactions', icon: DollarSign, path: '/admin/transactions' },
      { id: 'support', label: 'Support Tickets', icon: AlertCircle, path: '/admin/support', badge: 'pending_support_tickets', urgent: true },
      { id: 'documents', label: 'Document Review', icon: Shield, path: '/admin/documents' },
      { id: 'providers', label: 'Provider Directory', icon: UserCheck, path: '/admin/providers' },
    ],
  },
  {
    title: 'Content',
    items: [
      { id: 'blog', label: 'Blog Management', icon: BookOpen, path: '/admin/blog' },
      { id: 'faq', label: 'FAQ Management', icon: HelpCircle, path: '/admin/faq' },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/admin/notifications' },
    ],
  },
  {
    title: 'SEO',
    items: [
      { id: 'seo-analytics', label: 'SEO Analytics', icon: TrendingUp, path: '/admin/seo-analytics' },
      { id: 'seo-settings', label: 'SEO Settings', icon: Search, path: '/admin/seo-settings' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { id: 'settings', label: 'System Settings', icon: Settings, path: '/admin/settings' },
      { id: 'health', label: 'Health Monitor', icon: Monitor, path: '/admin/health' },
    ],
  },
];

// ============================================================================
// SUB COMPONENTS
// ============================================================================

/**
 * Badge component for navigation items
 */
const NavBadge = memo(function NavBadge({
  value,
  urgent = false,
}: {
  value: number;
  urgent?: boolean;
}) {
  if (value <= 0) return null;

  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs font-medium rounded-full transition-colors',
        urgent
          ? 'bg-red-500/20 text-red-400'
          : 'bg-slate-700 text-slate-300'
      )}
      aria-label={urgent ? `${value} urgent items` : `${value} items`}
    >
      {value}
    </span>
  );
});

/**
 * Admin navigation item component
 */
const AdminNavItem = memo(function AdminNavItem({
  item,
  isActive,
  isMenuExpanded,
  isExpanded,
  stats,
  onNavigate,
  onToggleSubmenu,
}: {
  item: NavItem;
  isActive: boolean;
  isMenuExpanded: boolean;
  isExpanded: boolean;
  stats: ReturnType<typeof useAdminStats>['stats'];
  onNavigate: (path: string) => void;
  onToggleSubmenu: (id: string) => void;
}) {
  const Icon = item.icon;
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const badgeValue = item.badge ? stats[item.badge] : null;
  const location = useLocation();

  const handleClick = useCallback(() => {
    if (hasSubmenu && isExpanded) {
      onToggleSubmenu(item.id);
    } else if (item.path) {
      onNavigate(item.path);
    }
  }, [hasSubmenu, isExpanded, item.id, item.path, onNavigate, onToggleSubmenu]);

  return (
    <li>
      <button
        onClick={handleClick}
        title={item.label}
        aria-current={isActive && !hasSubmenu ? 'page' : undefined}
        aria-expanded={hasSubmenu ? isMenuExpanded : undefined}
        className={cn(
          'flex items-center w-full px-3 py-2.5 rounded-lg',
          'transition-all duration-200 group',
          'touch-manipulation active:scale-[0.98]',
          `min-h-[${SIDEBAR_CONSTANTS.MIN_TOUCH_TARGET}px]`,
          isActive && !hasSubmenu
            ? 'bg-primary-500/10 border-l-2 border-primary-400 text-white font-medium'
            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
          !isExpanded && 'justify-center'
        )}
      >
        <div className="relative flex-shrink-0">
          <Icon
            className={cn(
              'w-5 h-5',
              isActive && 'text-primary-400'
            )}
            aria-hidden="true"
          />
          {/* Urgent indicator for collapsed state */}
          {item.urgent && badgeValue && badgeValue > 0 && !isExpanded && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full">
              <span className="absolute inset-0 w-full h-full bg-red-500 rounded-full animate-ping" />
            </span>
          )}
        </div>

        {isExpanded && (
          <>
            <span className="flex-1 text-sm text-left ml-3">{item.label}</span>

            {badgeValue !== null && badgeValue > 0 && (
              <NavBadge value={badgeValue} urgent={item.urgent} />
            )}

            {hasSubmenu && (
              <ChevronRight
                className={cn(
                  'w-4 h-4 ml-2 transition-transform duration-200',
                  isMenuExpanded && 'rotate-90'
                )}
                aria-hidden="true"
              />
            )}
          </>
        )}
      </button>

      {/* Submenu */}
      {hasSubmenu && isMenuExpanded && isExpanded && (
        <ul
          aria-label={`${item.label} submenu`}
          className="mt-1 ml-4 pl-3 border-l border-slate-700 space-y-1 animate-in slide-in-from-top-2 duration-200"
        >
          {item.submenu!.map((subItem) => {
            const isSubActive = location.pathname === subItem.path;
            const subBadgeValue = subItem.badge ? stats[subItem.badge] : null;

            return (
              <li key={subItem.id}>
                <button
                  onClick={() => onNavigate(subItem.path)}
                  aria-current={isSubActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center w-full px-3 py-2 rounded-lg text-sm',
                    'transition-all duration-200',
                    'touch-manipulation active:scale-[0.98]',
                    isSubActive
                      ? 'bg-primary-500/10 text-primary-400 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  )}
                >
                  <span className="flex-1 text-left">{subItem.label}</span>
                  {subBadgeValue !== null && subBadgeValue > 0 && (
                    <NavBadge value={subBadgeValue} urgent={subItem.urgent} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function AdminSidebarComponent({ isExpanded, onToggle }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { stats } = useAdminStats();

  // Use our custom hooks
  const { isMobile, sidebarRef, handleTouchStart, handleTouchMove, handleTouchEnd, dragOffset, isDragging } = useSidebar({
    initialExpanded: isExpanded,
    onExpandedChange: (expanded) => {
      if (expanded !== isExpanded) onToggle();
    },
  });

  const expandedMenus = useExpandedMenus([]);

  // Focus trap and body scroll lock for mobile
  useFocusTrap(isMobile && isExpanded, sidebarRef);
  useBodyScrollLock(isMobile && isExpanded);

  // Handle escape key
  useEffect(() => {
    const handleEscape = () => {
      if (isMobile && isExpanded) {
        onToggle();
      }
    };

    const currentRef = sidebarRef.current;
    currentRef?.addEventListener('sidebar-escape', handleEscape);
    return () => {
      currentRef?.removeEventListener('sidebar-escape', handleEscape);
    };
  }, [isMobile, isExpanded, onToggle, sidebarRef]);

  // Auto-expand menus based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    
    navigationGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.submenu) {
          const hasActiveSubmenu = item.submenu.some(sub =>
            currentPath === sub.path || currentPath.startsWith(sub.path + '/')
          );
          if (hasActiveSubmenu) {
            expandedMenus.expandMenu(item.id);
          }
        }
      });
    });
  }, [location.pathname, expandedMenus]);

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

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    if (isMobile) onToggle();
  }, [navigate, isMobile, onToggle]);

  // Check if route is active
  const isActiveRoute = useCallback((path?: string, submenu?: NavItem['submenu']) => {
    if (!path) return false;
    const currentPath = location.pathname;
    if (currentPath === path) return true;
    if (submenu) {
      return submenu.some(sub => currentPath === sub.path || currentPath.startsWith(sub.path + '/'));
    }
    return currentPath.startsWith(path + '/');
  }, [location.pathname]);

  // Sidebar transform for drag gesture
  const sidebarTransform = useMemo(() => {
    if (isDragging && isMobile) {
      return `translateX(${Math.max(dragOffset, SIDEBAR_CONSTANTS.MAX_DRAG_OFFSET)}px)`;
    }
    return undefined;
  }, [isDragging, isMobile, dragOffset]);

  return (
    <>
      {/* Mobile overlay */}
      <SidebarOverlay
        isVisible={isMobile && isExpanded}
        onClose={onToggle}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="navigation"
        aria-label="Admin navigation"
        className={cn(
          'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950',
          'text-white h-screen flex flex-col overflow-hidden',
          'fixed top-0 left-0 z-40 shadow-2xl',
          'transition-transform duration-300 ease-out',
          'border-r border-slate-800',
          'will-change-transform',
          isExpanded ? 'w-72' : 'w-[72px]',
          isMobile && !isExpanded ? '-translate-x-full' : 'translate-x-0'
        )}
        style={{
          transform: sidebarTransform,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Mobile toggle button */}
        <SidebarToggleButton
          isExpanded={isExpanded}
          onToggle={onToggle}
          variant="mobile"
          theme="admin"
        />

        {/* Desktop toggle button */}
        <SidebarToggleButton
          isExpanded={isExpanded}
          onToggle={onToggle}
          variant="desktop"
          theme="admin"
        />

        {/* Main content */}
        <div
          className={cn(
            'flex-1 flex flex-col overflow-hidden',
            isExpanded ? 'p-4' : 'p-3'
          )}
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className={cn('flex items-center', isExpanded ? 'gap-3' : 'justify-center')}>
              <div
                className={cn(
                  isExpanded ? 'w-10 h-10' : 'w-9 h-9',
                  'rounded-xl flex items-center justify-center shadow-lg',
                  'bg-gradient-to-br from-emerald-500 to-emerald-600 flex-shrink-0'
                )}
              >
                <Globe className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-white leading-tight">
                    Web Control Center
                  </h1>
                  <p className="text-slate-400 text-xs">Admin Dashboard</p>
                </div>
              )}
            </div>
          </div>

          {/* Search Hint */}
          <SidebarSearchHint isExpanded={isExpanded} />

          {/* Navigation */}
          <nav
            className="flex-1 space-y-4 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
            aria-label="Admin menu"
          >
            {navigationGroups.map((group) => (
              <div key={group.title}>
                {isExpanded && (
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-3">
                    {group.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <AdminNavItem
                      key={item.id}
                      item={item}
                      isActive={isActiveRoute(item.path, item.submenu)}
                      isMenuExpanded={expandedMenus.isMenuExpanded(item.id)}
                      isExpanded={isExpanded}
                      stats={stats}
                      onNavigate={handleNavigation}
                      onToggleSubmenu={expandedMenus.toggleMenu}
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
            onLogout={handleLogout}
            theme="admin"
            roleLabel="Super Admin"
          />
        </div>
      </aside>
    </>
  );
}

// Memoize to prevent unnecessary re-renders
export const AdminSidebar = memo(AdminSidebarComponent);

export default AdminSidebar;
