import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  BarChart3,
  Code,
  Shield,
  Share2,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useCurrentProfile } from '../../hooks/useDualDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { ViewingContextBadge } from '../ui/ViewingContextBadge';

interface CTODashboardLayoutProps {
  children: ReactNode;
}

export function CTODashboardLayout({ children }: CTODashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isDemoMode } = useAuth();
  const { data: profile, isLoading } = useCurrentProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (profile?.role) {
      document.documentElement.dataset.role = profile.role;
    }
    return () => {
      delete document.documentElement.dataset.role;
    };
  }, [profile?.role]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (profile && profile.role !== 'cto' && profile.role !== 'admin' && profile.role !== 'ceo' && profile.role !== 'staff') {
    return <Navigate to="/ceod/home" replace />;
  }

  const navItems = [
    { path: '/ctod/home', label: 'Home', icon: Home },
    { path: '/ctod/files', label: 'Files', icon: FileText },
    { path: '/ctod/kpis', label: 'KPIs', icon: BarChart3 },
    { path: '/ctod/engineering', label: 'Engineering', icon: Code },
    { path: '/ctod/compliance', label: 'Compliance', icon: Shield },
    { path: '/shared/overview', label: 'Shared', icon: Share2 },
  ];

  // Bottom tab bar items (subset for mobile)
  const bottomTabItems = [
    { path: '/ctod/home', label: 'Home', icon: Home },
    { path: '/ctod/files', label: 'Files', icon: FileText },
    { path: '/ctod/compliance', label: 'Compliance', icon: Shield },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      if (!isDemoMode) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/login');
    }
  };

  const isCEOViewing = profile?.role === 'ceo';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop/Tablet Top Navigation */}
      <nav 
        className="bg-white border-b border-gray-200 sticky top-0 z-30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Left section - Logo and title */}
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-2 md:gap-3">
                <img
                  src="/MPB-Health-No-background.png"
                  alt="MPB Health Logo"
                  className="h-8 md:h-10 w-auto object-contain"
                />
                <div className="hidden xs:block">
                  <h1 className={`text-sm md:text-lg font-bold leading-tight ${
                    isCEOViewing
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent'
                      : 'text-gray-900'
                  }`}>
                    {isCEOViewing ? 'CEO — CTO Overview' : 'CTO Dashboard'}
                  </h1>
                  <p className="text-xs text-gray-500 truncate max-w-[150px] md:max-w-none">
                    {profile?.display_name || profile?.email}
                  </p>
                </div>
              </div>
              
              {/* Divider */}
              <div className="hidden md:block h-6 w-px bg-gray-200" />
              
              {/* Desktop navigation */}
              <div className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg 
                        text-sm font-medium transition-all duration-200
                        min-h-touch
                        ${isCEOViewing
                          ? isActive
                            ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                          : isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon size={16} />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="hidden sm:block">
                <ViewingContextBadge />
              </div>
              
              {/* Desktop sign out */}
              <button
                onClick={handleSignOut}
                className="
                  hidden md:flex items-center gap-2 
                  px-3 py-2 text-gray-600 hover:text-gray-900 
                  rounded-lg hover:bg-gray-50 transition-colors
                  min-h-touch
                "
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="
                  md:hidden p-2.5 rounded-lg 
                  text-gray-600 hover:text-gray-900 hover:bg-gray-100
                  active:bg-gray-200 transition-colors
                  touch-manipulation min-h-touch min-w-touch
                  flex items-center justify-center
                "
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-out menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu panel */}
          <div 
            className="
              fixed top-0 right-0 bottom-0 w-[280px] max-w-[85vw]
              bg-white z-50 md:hidden
              shadow-2xl animate-slide-in-right
              flex flex-col
            "
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            {/* Menu header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="
                  p-2 rounded-lg text-gray-500 hover:text-gray-700 
                  hover:bg-gray-100 active:bg-gray-200
                  transition-colors touch-manipulation
                "
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu items */}
            <nav className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center justify-between
                        px-4 py-3.5 rounded-xl
                        text-base font-medium transition-all duration-200
                        touch-manipulation active:scale-[0.98]
                        min-h-touch
                        ${isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-gray-500'} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Menu footer */}
            <div 
              className="p-4 border-t border-gray-200"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <div className="mb-3">
                <ViewingContextBadge />
              </div>
              <button
                onClick={handleSignOut}
                className="
                  w-full flex items-center justify-center gap-2
                  px-4 py-3 rounded-xl
                  text-red-600 bg-red-50 hover:bg-red-100
                  font-medium transition-colors
                  touch-manipulation active:scale-[0.98]
                  min-h-touch
                "
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main 
        className="w-full min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)]"
        style={{ 
          paddingBottom: 'max(4.5rem, calc(4rem + env(safe-area-inset-bottom)))',
        }}
      >
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <div 
        className="
          fixed bottom-0 left-0 right-0 z-30 md:hidden
          bg-white border-t border-gray-200
          flex items-center justify-around
        "
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {bottomTabItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center
                flex-1 py-2 min-h-[56px]
                text-xs font-medium
                transition-colors duration-200
                touch-manipulation active:bg-gray-100
                ${isActive 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <Icon size={22} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
        
        {/* More menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="
            flex flex-col items-center justify-center
            flex-1 py-2 min-h-[56px]
            text-xs font-medium text-gray-500
            transition-colors duration-200
            touch-manipulation active:bg-gray-100
          "
        >
          <Menu size={22} className="text-gray-400" />
          <span className="mt-1">More</span>
        </button>
      </div>
    </div>
  );
}
