import { ReactNode, useEffect } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  BarChart3,
  Code,
  Shield,
  Share2,
  LogOut
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

  useEffect(() => {
    if (profile?.role) {
      document.documentElement.dataset.role = profile.role;
    }
    return () => {
      delete document.documentElement.dataset.role;
    };
  }, [profile?.role]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-3">
                <img
                  src="/MPB-Health-No-background.png"
                  alt="MPB Health Logo"
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <h1 className={`text-lg font-bold ${
                    profile?.role === 'ceo'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent'
                      : 'text-gray-900'
                  }`}>
                    {profile?.role === 'ceo' ? 'CEO Dashboard — CTO Technology Overview' : 'CTO Dashboard'}
                  </h1>
                  <p className="text-xs text-gray-500">{profile?.display_name || profile?.email}</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        profile?.role === 'ceo'
                          ? isActive
                            ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                          : isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ViewingContextBadge />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full h-full">
        {children}
      </main>
    </div>
  );
}
