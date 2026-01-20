import { ReactNode, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminStatsBar } from './AdminStatsBar';
import { AdminStatsProvider } from './AdminStatsContext';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  showStatsBar?: boolean;
}

// Breadcrumb mapping for admin routes
const routeTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/members': 'Member Management',
  '/admin/claims': 'Claims Processing',
  '/admin/support': 'Support Tickets',
  '/admin/transactions': 'Transactions',
  '/admin/blog': 'Blog Management',
  '/admin/faq': 'FAQ Management',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'System Settings',
  '/admin/providers': 'Provider Directory',
  '/admin/live': 'Live View',
  '/admin/analytics': 'Analytics Overview',
  '/admin/traffic': 'Traffic Sources',
  '/admin/marketing': 'Marketing Analytics',
  '/admin/documents': 'Document Review',
  '/admin/seo-analytics': 'SEO Analytics',
  '/admin/seo-settings': 'SEO Settings',
  '/admin/health': 'Health Monitor',
};

function AdminLayoutContent({ children, showStatsBar = true }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Determine the return dashboard based on user role
  const getReturnDashboard = () => {
    const role = profile?.role?.toLowerCase();
    if (role === 'ceo') return { path: '/ceod/home', label: 'CEO Dashboard' };
    return { path: '/ctod/home', label: 'CTO Dashboard' };
  };

  const returnDashboard = getReturnDashboard();
  const currentPageTitle = routeTitles[location.pathname] || 'Web Control Center';

  useEffect(() => {
    function checkScreenSize() {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);

      // Auto-collapse sidebar on mobile
      if (mobile) {
        setIsSidebarExpanded(false);
      }
    }

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  // Calculate main content left margin based on sidebar state
  const getMainContentClass = () => {
    if (isMobile) {
      return 'pl-0';
    }
    if (isSidebarExpanded) {
      return 'md:pl-72'; // 288px
    }
    return 'md:pl-[72px]'; // 72px collapsed
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
      />

      {/* Mobile hamburger menu button */}
      {isMobile && !isSidebarExpanded && (
        <button
          className="
            fixed z-50
            p-3 rounded-xl
            bg-emerald-600 text-white 
            shadow-lg shadow-emerald-500/30
            md:hidden
            touch-manipulation
            active:scale-95 active:bg-emerald-700
            transition-all duration-200
            min-h-[44px] min-w-[44px]
            flex items-center justify-center
          "
          style={{
            top: 'max(1rem, env(safe-area-inset-top))',
            left: 'max(1rem, env(safe-area-inset-left))',
          }}
          onClick={toggleSidebar}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <main
        className={`
          flex-1 min-h-screen
          overflow-y-auto overflow-x-hidden
          transition-all duration-300 ease-out
          ${getMainContentClass()}
        `}
      >
        {/* Navigation Header - Back to Dashboard + Breadcrumbs */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Left: Back Button + Breadcrumbs */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(returnDashboard.path)}
                  className="
                    flex items-center gap-2 px-3 py-1.5 rounded-lg
                    text-slate-600 hover:text-slate-900 hover:bg-slate-100
                    transition-all duration-200 group
                  "
                  title={`Return to ${returnDashboard.label}`}
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="text-sm font-medium hidden sm:inline">Back</span>
                </button>

                {/* Breadcrumb separator */}
                <div className="hidden sm:flex items-center gap-2 text-slate-400">
                  <ChevronRight className="w-4 h-4" />
                </div>

                {/* Breadcrumbs */}
                <nav className="hidden sm:flex items-center gap-2 text-sm">
                  <button
                    onClick={() => navigate(returnDashboard.path)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>{returnDashboard.label}</span>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <button
                    onClick={() => navigate('/admin')}
                    className={`${location.pathname === '/admin' ? 'text-emerald-600 font-medium' : 'text-slate-500 hover:text-slate-700'} transition-colors`}
                  >
                    Web Control Center
                  </button>
                  {location.pathname !== '/admin' && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-emerald-600 font-medium">{currentPageTitle}</span>
                    </>
                  )}
                </nav>

                {/* Mobile: Just show current page */}
                <span className="sm:hidden text-sm font-medium text-slate-700">
                  {currentPageTitle}
                </span>
              </div>

              {/* Right: Quick return button (more prominent on mobile) */}
              <button
                onClick={() => navigate(returnDashboard.path)}
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-lg
                  bg-gradient-to-r from-slate-700 to-slate-800
                  text-white text-sm font-medium
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98]
                "
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">{returnDashboard.label}</span>
                <span className="sm:hidden">Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {showStatsBar && <AdminStatsBar />}

        {/* Main content container - pb-24 for Galaxy Dock clearance */}
        <div 
          className="w-full pb-24"
          style={{
            paddingTop: isMobile && !showStatsBar ? 'max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem))' : undefined,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AdminLayout({ children, showStatsBar = true }: AdminLayoutProps) {
  return (
    <AdminStatsProvider>
      <AdminLayoutContent showStatsBar={showStatsBar}>
        {children}
      </AdminLayoutContent>
    </AdminStatsProvider>
  );
}

export default AdminLayout;

