import { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  TrendingUp,
  Megaphone,
  DollarSign,
  FolderKanban,
  CheckSquare,
  Share2,
  LogOut,
  MessageSquare,
  ShoppingCart,
  Activity,
  Database,
  Code,
  BarChart3,
  Shield
} from 'lucide-react';
import { useCurrentProfile } from '../../hooks/useDualDashboard';
import { supabase } from '../../lib/supabase';
import { DashboardViewToggle } from '../ui/DashboardViewToggle';
import { ViewingContextBadge } from '../ui/ViewingContextBadge';

interface CEODashboardLayoutProps {
  children: ReactNode;
}

export function CEODashboardLayout({ children }: CEODashboardLayoutProps) {
  const location = useLocation();
  const { data: profile } = useCurrentProfile();

  const ceoNavItems = [
    { path: '/ceod/home', label: 'CEO Home', icon: Home },
    { path: '/ceod/marketing', label: 'Marketing', icon: Megaphone },
    { path: '/ceod/concierge/tracking', label: 'Concierge', icon: MessageSquare },
    { path: '/ceod/sales/reports', label: 'Sales', icon: ShoppingCart },
    { path: '/ceod/operations/overview', label: 'Operations', icon: Activity },
    { path: '/ceod/data', label: 'Data Import', icon: Database },
    { path: '/ceod/files', label: 'CEO Files', icon: FileText },
    { path: '/ceod/board', label: 'Board Packet', icon: TrendingUp },
  ];

  const ctoNavItems = [
    { path: '/ctod/home', label: 'CTO Home', icon: Code },
    { path: '/ctod/files', label: 'CTO Files', icon: FileText },
    { path: '/ctod/kpis', label: 'Tech KPIs', icon: BarChart3 },
    { path: '/ctod/engineering', label: 'Engineering', icon: Code },
    { path: '/ctod/compliance', label: 'Compliance', icon: Shield },
  ];

  const sharedNavItems = [
    { path: '/shared/overview', label: 'Shared View', icon: Share2 },
  ];

  useEffect(() => {
    if (profile?.role) {
      document.documentElement.dataset.role = profile.role;
    }
    return () => {
      delete document.documentElement.dataset.role;
    };
  }, [profile?.role]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <img
                  src="/MPB-Health-No-background.png"
                  alt="MPB Health Logo"
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    CEO Dashboard — {profile?.display_name || 'Catherine Okubo'}
                  </h1>
                  <p className="text-xs text-gray-500">MPB Health Executive Portal</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-4 overflow-x-auto max-w-4xl">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-pink-600 mr-2">CEO Portal</span>
                  {ceoNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="hidden xl:inline">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="h-8 w-px bg-gray-300"></div>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-gray-500 mr-2">CTO Access</span>
                  {ctoNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border ${
                          isActive
                            ? 'bg-pink-50 text-pink-700 border-pink-300 shadow-sm'
                            : 'text-gray-500 hover:bg-pink-50 hover:text-pink-600 border-gray-300 hover:border-pink-300'
                        }`}
                        title={`View CTO: ${item.label}`}
                      >
                        <Icon size={16} />
                        <span className="hidden xl:inline">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DashboardViewToggle />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
