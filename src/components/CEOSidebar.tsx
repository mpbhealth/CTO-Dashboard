import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Target,
  Award,
  Briefcase,
  FileText,
  Settings,
  Bell,
  DollarSign,
  Activity,
  Globe,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigationItems: NavItem[] = [
  { name: 'Executive Overview', path: '/ceo', icon: LayoutDashboard },
  { name: 'Sales Performance', path: '/ceo/sales', icon: TrendingUp },
  { name: 'Marketing Analytics', path: '/ceo/marketing', icon: Target },
  { name: 'Enrollment Insights', path: '/ceo/enrollments', icon: Users },
  { name: 'Agent Performance', path: '/ceo/agents', icon: Award },
  { name: 'Operations', path: '/ceo/operations', icon: Activity },
  { name: 'Financial Overview', path: '/ceo/financial', icon: DollarSign },
  { name: 'Strategic Goals', path: '/ceo/goals', icon: Briefcase },
  { name: 'Reports & Analytics', path: '/ceo/reports', icon: FileText },
];

export default function CEOSidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === '/ceo') {
      return location.pathname === '/ceo';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`bg-gradient-to-b from-pink-600 to-pink-700 text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } min-h-screen flex flex-col shadow-2xl`}
    >
      {/* Header */}
      <div className="p-6 border-b border-pink-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center shadow-lg bg-white p-1.5`}>
              <img
                src="/MPB-Health-No-background.png"
                alt="MPB Health Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">MPB Health</h1>
                <p className="text-xs text-pink-100 mt-1">Executive Portal</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-pink-800 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-pink-900 text-white shadow-lg'
                  : 'hover:bg-pink-800 text-pink-50'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-pink-800 space-y-2">
        <Link
          to="/ceo/notifications"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-pink-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Notifications' : undefined}
        >
          <Bell className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium text-sm">Notifications</span>}
          {!isCollapsed && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              3
            </span>
          )}
        </Link>

        <Link
          to="/ceo/settings"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-pink-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
        </Link>

        {/* Role Switcher */}
        {!isCollapsed && (
          <div className="pt-4 mt-4 border-t border-pink-800">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xs text-pink-100 hover:text-white transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Switch to CTO Dashboard</span>
            </Link>
          </div>
        )}
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 bg-pink-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-300 rounded-full flex items-center justify-center font-bold text-pink-900">
              CEO
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Catherine Okubo</p>
              <p className="text-xs text-pink-200 truncate">Chief Executive Officer</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

