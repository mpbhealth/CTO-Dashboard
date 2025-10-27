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
  Database
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
    { path: '/ceod/home', label: 'Home', icon: Home },
    { path: '/ceod/marketing', label: 'Marketing', icon: Megaphone },
    { path: '/ceod/concierge/tracking', label: 'Concierge', icon: MessageSquare },
    { path: '/ceod/sales/reports', label: 'Sales', icon: ShoppingCart },
    { path: '/ceod/operations/overview', label: 'Operations', icon: Activity },
    { path: '/ceod/data', label: 'Data Import', icon: Database },
    { path: '/ceod/files', label: 'Files', icon: FileText },
    { path: '/ceod/board', label: 'Board Packet', icon: TrendingUp },
    { path: '/shared/overview', label: 'Shared from CTO', icon: Share2 },
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
                <div className="w-8 h-8 bg-gradient-to-br from-[#1a3d97] to-[#00A896] rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">CEO Dashboard — {profile?.display_name || 'Catherine Okubo'}</h1>
                  <p className="text-xs text-gray-500">MPB Health Executive Portal</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-[#1a3d97]'
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
              <div className="px-3 py-1 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-full text-xs font-medium">
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
