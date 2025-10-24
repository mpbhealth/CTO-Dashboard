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
      className={`bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } min-h-screen flex flex-col shadow-2xl`}
    >
      {/* Header */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-amber-400">MPB Health</h1>
              <p className="text-xs text-blue-200 mt-1">Executive Portal</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'hover:bg-blue-700 text-blue-100'
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
      <div className="p-4 border-t border-blue-700 space-y-2">
        <Link
          to="/ceo/notifications"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors ${
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
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
        </Link>

        {/* Role Switcher */}
        {!isCollapsed && (
          <div className="pt-4 mt-4 border-t border-blue-700">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xs text-blue-200 hover:text-white transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Switch to CTO Dashboard</span>
            </Link>
          </div>
        )}
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 bg-blue-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-bold text-white">
              CEO
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">CEO Portal</p>
              <p className="text-xs text-blue-300 truncate">Executive Access</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

