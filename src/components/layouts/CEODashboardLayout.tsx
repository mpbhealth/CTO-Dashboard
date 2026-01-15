import { ReactNode, useState, useCallback, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../Sidebar';

interface CEODashboardLayoutProps {
  children: ReactNode;
}

export function CEODashboardLayout({ children }: CEODashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('ceo-home');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    function checkScreenSize() {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setIsSidebarExpanded(false);
      }
      // Keep sidebar expanded on desktop, collapsed on tablet for more space
      else if (tablet) {
        setIsSidebarExpanded(false);
      }
    }

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  // Calculate main content left margin based on sidebar state
  const getMainContentClass = () => {
    if (isMobile) {
      // On mobile, no left padding - sidebar overlays
      return 'pl-0';
    }
    if (isSidebarExpanded) {
      // Expanded sidebar = 320px (w-80)
      return 'md:pl-80';
    }
    // Collapsed sidebar = 80px (w-20)
    return 'md:pl-20';
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden pb-24">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        onSidebarToggle={toggleSidebar}
      />

      {/* Mobile hamburger menu button */}
      {isMobile && !isSidebarExpanded && (
        <button
          className="
            fixed top-4 left-4 z-50
            p-3 rounded-xl
            bg-indigo-600 text-white 
            shadow-lg shadow-indigo-500/30
            md:hidden
            touch-manipulation
            active:scale-95 active:bg-indigo-700
            transition-all duration-200
            min-h-touch min-w-touch
            flex items-center justify-center
          "
          onClick={toggleSidebar}
          aria-label="Open navigation menu"
          style={{
            top: 'max(1rem, env(safe-area-inset-top))',
          }}
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
        {/* Responsive content container */}
        <div 
          className="
            w-full max-w-[1920px] mx-auto
            px-4 xs:px-5 sm:px-6 md:px-8 lg:px-12 xl:px-16
            py-4 xs:py-5 sm:py-6 md:py-8 lg:py-10
          "
          style={{
            // Add top padding for mobile hamburger button
            paddingTop: isMobile ? 'max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem))' : undefined,
            // Add bottom safe area
            paddingBottom: isMobile ? 'max(1rem, env(safe-area-inset-bottom))' : undefined,
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
