import { ReactNode, useState, useCallback, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminStatsBar } from './AdminStatsBar';
import { AdminStatsProvider } from './AdminStatsContext';

interface AdminLayoutProps {
  children: ReactNode;
  showStatsBar?: boolean;
}

function AdminLayoutContent({ children, showStatsBar = true }: AdminLayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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
        {/* Stats Bar */}
        {showStatsBar && <AdminStatsBar />}

        {/* Main content container */}
        <div 
          className="w-full"
          style={{
            paddingTop: isMobile && !showStatsBar ? 'max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem))' : undefined,
            paddingBottom: isMobile ? 'max(1rem, env(safe-area-inset-bottom))' : undefined,
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

