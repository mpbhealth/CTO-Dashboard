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
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
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

      <main className={`flex-1 overflow-y-auto transition-all duration-300 w-full ${
        isMobile ? 'p-3' : 'p-8 pl-12'
      } ${isSidebarExpanded ? 'md:pl-96' : isMobile ? 'ml-0 pt-16' : 'md:pl-32'}`}>
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
