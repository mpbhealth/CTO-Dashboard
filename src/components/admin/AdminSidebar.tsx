import { useState, useEffect, useCallback, useRef } from 'react';
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
  LogOut,
  ChevronRight,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  BarChart3,
  Globe,
  TrendingUp,
  Search,
  Shield,
  UserCheck,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminStats } from './AdminStatsContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  badge?: keyof ReturnType<typeof useAdminStats>['stats'];
  urgent?: boolean;
  submenu?: Array<{
    id: string;
    label: string;
    path: string;
    badge?: keyof ReturnType<typeof useAdminStats>['stats'];
    urgent?: boolean;
  }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

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

interface AdminSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isExpanded, onToggle }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile, isDemoMode } = useAuth();
  const { stats } = useAdminStats();
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Touch handlers for mobile swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isExpanded) return;
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, [isMobile, isExpanded]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (diff < 0) setDragOffset(diff);
  }, [isDragging, isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -100) onToggle();
    setDragOffset(0);
  }, [isDragging, dragOffset, onToggle]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('mpb_access_verified');
      await signOut();
      if (!isDemoMode) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/login');
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) onToggle();
  };

  const isActiveRoute = (path?: string, submenu?: NavItem['submenu']) => {
    if (!path) return false;
    const currentPath = location.pathname;
    if (currentPath === path) return true;
    if (submenu) {
      return submenu.some(sub => currentPath === sub.path || currentPath.startsWith(sub.path + '/'));
    }
    return currentPath.startsWith(path + '/');
  };

  const toggleSubmenu = (itemId: string) => {
    setExpandedMenus(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const sidebarTransform = isDragging && isMobile
    ? `translateX(${Math.max(dragOffset, -320)}px)`
    : undefined;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
          text-white h-screen flex flex-col overflow-y-auto overflow-x-hidden
          fixed top-0 left-0 z-40 shadow-2xl
          transition-transform duration-300 ease-out
          border-r border-slate-800
          ${isExpanded ? 'w-72' : 'w-[72px]'}
          ${isMobile && !isExpanded ? '-translate-x-full' : 'translate-x-0'}
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
            bg-slate-800 text-white md:hidden z-50 
            shadow-lg active:scale-95 transition-transform
            touch-manipulation
          `}
          onClick={onToggle}
          aria-label={isExpanded ? 'Close menu' : 'Open menu'}
        >
          {isExpanded ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop toggle button */}
        <button
          className={`
            hidden md:flex items-center justify-center
            absolute top-6 right-0 transform translate-x-1/2 
            w-8 h-8 rounded-full 
            bg-slate-700 hover:bg-slate-600 
            text-white z-50 cursor-pointer
            transition-all duration-200 hover:scale-110
          `}
          onClick={onToggle}
        >
          {isExpanded ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
        </button>

        <div 
          className={`${isExpanded ? 'p-4' : 'p-3'} flex-1 flex flex-col`}
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
              <div className={`
                ${isExpanded ? 'w-10 h-10' : 'w-9 h-9'} 
                rounded-xl flex items-center justify-center shadow-lg 
                bg-gradient-to-br from-emerald-500 to-emerald-600 flex-shrink-0
              `}>
                <Globe className="w-5 h-5 text-white" />
              </div>
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-white leading-tight">Web Control Center</h1>
                  <p className="text-slate-400 text-xs">Admin Dashboard</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Search Hint */}
          {isExpanded && (
            <div className="mb-4 px-3 py-2 bg-slate-800/50 rounded-lg text-xs text-slate-400 flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">⌘K</kbd> to search</span>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-4 overflow-y-auto">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                {isExpanded && (
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-3">
                    {group.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.path, item.submenu);
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isMenuExpanded = expandedMenus.includes(item.id);
                    const badgeValue = item.badge ? stats[item.badge] : null;

                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            if (hasSubmenu && isExpanded) {
                              toggleSubmenu(item.id);
                            } else if (item.path) {
                              handleNavigation(item.path);
                            }
                          }}
                          title={item.label}
                          className={`
                            flex items-center w-full px-3 py-2.5 rounded-lg
                            transition-all duration-200 group
                            ${isActive && !hasSubmenu
                              ? 'bg-primary-500/10 border-l-2 border-primary-400 text-white font-medium'
                              : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                            }
                            ${!isExpanded ? 'justify-center' : 'space-x-3'}
                          `}
                        >
                          <div className="relative">
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
                            {item.urgent && badgeValue && badgeValue > 0 && !isExpanded && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                            )}
                          </div>
                          
                          {isExpanded && (
                            <>
                              <span className="flex-1 text-sm text-left">{item.label}</span>
                              
                              {badgeValue !== null && badgeValue > 0 && (
                                <span className={`
                                  px-2 py-0.5 text-xs font-medium rounded-full
                                  ${item.urgent 
                                    ? 'bg-red-500/20 text-red-400' 
                                    : 'bg-slate-700 text-slate-300'
                                  }
                                `}>
                                  {badgeValue}
                                </span>
                              )}
                              
                              {hasSubmenu && (
                                <ChevronRight className={`
                                  w-4 h-4 transition-transform duration-200
                                  ${isMenuExpanded ? 'rotate-90' : ''}
                                `} />
                              )}
                            </>
                          )}
                        </button>

                        {/* Submenu */}
                        {hasSubmenu && isMenuExpanded && isExpanded && (
                          <ul className="mt-1 ml-4 pl-3 border-l border-slate-700 space-y-1">
                            {item.submenu!.map((subItem) => {
                              const isSubActive = location.pathname === subItem.path;
                              const subBadgeValue = subItem.badge ? stats[subItem.badge] : null;
                              
                              return (
                                <li key={subItem.id}>
                                  <button
                                    onClick={() => handleNavigation(subItem.path)}
                                    className={`
                                      flex items-center w-full px-3 py-2 rounded-lg text-sm
                                      transition-all duration-200
                                      ${isSubActive
                                        ? 'bg-primary-500/10 text-primary-400 font-medium'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                      }
                                    `}
                                  >
                                    <span className="flex-1 text-left">{subItem.label}</span>
                                    {subBadgeValue !== null && subBadgeValue > 0 && (
                                      <span className={`
                                        px-2 py-0.5 text-xs font-medium rounded-full
                                        ${subItem.urgent 
                                          ? 'bg-red-500/20 text-red-400' 
                                          : 'bg-slate-700 text-slate-300'
                                        }
                                      `}>
                                        {subBadgeValue}
                                      </span>
                                    )}
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
          <div className="mt-auto pt-4 border-t border-slate-800">
            {/* User Info */}
            <div className={`
              flex items-center ${isExpanded ? 'space-x-3 p-3' : 'justify-center p-2'} 
              rounded-lg transition-colors cursor-pointer mb-2
              hover:bg-slate-800
            `}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 flex-shrink-0">
                <span className="text-sm font-bold text-white">
                  {profile?.display_name 
                    ? profile.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                    : 'AD'
                  }
                </span>
              </div>
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {profile?.display_name || profile?.full_name || 'Admin User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">Super Admin</p>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`
                flex items-center w-full px-3 py-2.5 rounded-lg
                transition-all duration-200 text-slate-400
                hover:bg-red-600 hover:text-white
                ${!isExpanded ? 'justify-center' : 'space-x-3'}
              `}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="text-sm">Sign Out</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminSidebar;

