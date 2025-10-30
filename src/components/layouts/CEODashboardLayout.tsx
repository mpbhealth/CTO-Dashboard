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

  useEffect(() => {
    function checkIfMobile() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarExpanded(false);
      }
    }

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        onSidebarToggle={toggleSidebar}
      />

      {isMobile && !isSidebarExpanded && (
        <button
          className="fixed top-4 left-4 p-3 rounded-md bg-pink-600 text-white shadow-lg md:hidden z-50"
          onClick={toggleSidebar}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <main className={`flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ${
        isSidebarExpanded ? 'md:ml-80' : isMobile ? 'ml-0' : 'md:ml-20'
      }`}>
        <div className={`w-full ${
          isMobile ? 'px-4 py-4' : 'px-4 sm:px-6 lg:px-8 py-6'
        }`}>
          {children}
        </div>
      </main>
    </div>
  );
}
