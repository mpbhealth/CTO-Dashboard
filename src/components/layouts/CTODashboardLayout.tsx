import { ReactNode, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
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
import { supabase } from '../../lib/supabase';

interface CTODashboardLayoutProps {
  children: ReactNode;
}

export function CTODashboardLayout({ children }: CTODashboardLayoutProps) {
  const location = useLocation();
  const { data: profile, isLoading } = useCurrentProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (profile && profile.role !== 'cto' && profile.role !== 'admin') {
    return <Navigate to="/ceod/home" replace />;
  }

  useEffect(() => {
    document.documentElement.dataset.role = 'cto';
    return () => {
      delete document.documentElement.dataset.role;
    };
  }, []);

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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Force reload on error
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Code size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">CTO Dashboard</h1>
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
                        isActive
                          ? 'bg-blue-50 text-blue-700'
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
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                CTO
              </div>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
