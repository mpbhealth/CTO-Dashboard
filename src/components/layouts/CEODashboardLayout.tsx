import { ReactNode, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
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

interface CEODashboardLayoutProps {
  children: ReactNode;
}

export function CEODashboardLayout({ children }: CEODashboardLayoutProps) {
  const location = useLocation();
  const { data: profile } = useCurrentProfile();

  const navItems = [
    { path: '/ceod/home', label: 'CEO Home', icon: Home, section: 'ceo' },
    { path: '/ceod/marketing', label: 'Marketing', icon: Megaphone, section: 'ceo' },
    { path: '/ceod/concierge/tracking', label: 'Concierge', icon: MessageSquare, section: 'ceo' },
    { path: '/ceod/sales/reports', label: 'Sales', icon: ShoppingCart, section: 'ceo' },
    { path: '/ceod/operations/overview', label: 'Operations', icon: Activity, section: 'ceo' },
    { path: '/ceod/data', label: 'Data Import', icon: Database, section: 'ceo' },
    { path: '/ceod/files', label: 'CEO Files', icon: FileText, section: 'ceo' },
    { path: '/ceod/board', label: 'Board Packet', icon: TrendingUp, section: 'ceo' },
    { path: '/ctod/home', label: 'CTO Home', icon: Code, section: 'cto' },
    { path: '/ctod/files', label: 'CTO Files', icon: FileText, section: 'cto' },
    { path: '/ctod/kpis', label: 'Tech KPIs', icon: BarChart3, section: 'cto' },
    { path: '/ctod/engineering', label: 'Engineering', icon: Code, section: 'cto' },
    { path: '/ctod/compliance', label: 'Compliance', icon: Shield, section: 'cto' },
    { path: '/shared/overview', label: 'Shared View', icon: Share2, section: 'shared' },
  ];

  useEffect(() => {
    document.documentElement.dataset.role = 'ceo';
    return () => {
      delete document.documentElement.dataset.role;
    };
  }, []);

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
                  <h1 className="text-lg font-bold text-gray-900">CEO Dashboard — {profile?.display_name || 'Catherine Okubo'}</h1>
                  <p className="text-xs text-gray-500">MPB Health Executive Portal</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-1 overflow-x-auto max-w-4xl">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  const isCTOSection = item.section === 'cto';
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? isCTOSection
                            ? 'bg-blue-600 text-white'
                            : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                          : isCTOSection
                            ? 'text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-300'
                            : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'
                      }`}
                      title={isCTOSection ? `CTO Dashboard: ${item.label}` : item.label}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full text-xs font-medium">
                CEO
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
