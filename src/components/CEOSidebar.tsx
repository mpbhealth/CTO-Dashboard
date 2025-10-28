import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Target,
  Award,
  Briefcase,
  FileText,
  DollarSign,
  Activity,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PieChart,
  BarChart3,
  Database,
  Upload,
} from 'lucide-react';
import { useState, useCallback, useMemo, memo } from 'react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  subItems?: NavItem[];
}

const navigationItems: NavItem[] = [
  { name: 'Executive Overview', path: '/ceod/home', icon: LayoutDashboard },
  {
    name: 'Analytics',
    path: '/ceod/analytics',
    icon: BarChart3,
    subItems: [
      { name: 'Analytics Overview', path: '/ceod/analytics/overview', icon: BarChart3 },
      { name: 'Member Engagement', path: '/ceod/analytics/member-engagement', icon: Users },
      { name: 'Member Retention', path: '/ceod/analytics/member-retention', icon: TrendingUp },
      { name: 'Advisor Performance', path: '/ceod/analytics/advisor-performance', icon: Award },
      { name: 'Marketing Analytics', path: '/ceod/analytics/marketing', icon: Target }
    ]
  },
  {
    name: 'Marketing',
    path: '/ceod/marketing',
    icon: Target,
    subItems: [
      { name: 'Marketing Dashboard', path: '/ceod/marketing', icon: Target },
      { name: 'Marketing Planner', path: '/ceod/marketing/planner', icon: FileText },
      { name: 'Content Calendar', path: '/ceod/marketing/calendar', icon: LayoutDashboard },
      { name: 'Marketing Budget', path: '/ceod/marketing/budget', icon: DollarSign }
    ]
  },
  {
    name: 'Concierge',
    path: '/ceod/concierge/tracking',
    icon: MessageSquare,
    subItems: [
      { name: 'Concierge Tracking', path: '/ceod/concierge/tracking', icon: Activity },
      { name: 'Concierge Notes', path: '/ceod/concierge/notes', icon: FileText }
    ]
  },
  { name: 'Sales Reports', path: '/ceod/sales/reports', icon: ShoppingCart },
  {
    name: 'Operations',
    path: '/ceod/operations/overview',
    icon: Activity,
    subItems: [
      { name: 'Operations Dashboard', path: '/ceod/operations/overview', icon: LayoutDashboard },
      { name: 'Operations Tracking', path: '/ceod/operations/tracking', icon: Activity }
    ]
  },
  {
    name: 'Finance',
    path: '/ceod/finance/overview',
    icon: DollarSign,
    subItems: [
      { name: 'Finance Snapshot', path: '/ceod/finance/overview', icon: DollarSign },
      { name: 'Finance Details', path: '/ceod/finance', icon: PieChart }
    ]
  },
  { name: 'SaudeMAX Reports', path: '/ceod/saudemax/reports', icon: Headphones },
  {
    name: 'Department Data',
    path: '/ceod/data',
    icon: Database,
    subItems: [
      { name: 'Data Management', path: '/ceod/data', icon: Database },
      { name: 'Department Upload', path: '/ceod/upload', icon: Upload },
      { name: 'Upload Portal', path: '/ceod/upload-portal', icon: Upload },
      { name: 'Concierge Dept', path: '/ceod/departments/concierge', icon: MessageSquare },
      { name: 'Sales Dept', path: '/ceod/departments/sales', icon: ShoppingCart },
      { name: 'Operations Dept', path: '/ceod/departments/operations', icon: Activity },
      { name: 'Finance Dept', path: '/ceod/departments/finance', icon: DollarSign },
      { name: 'SaudeMAX Dept', path: '/ceod/departments/saudemax', icon: Headphones }
    ]
  },
  { name: 'Board Packet', path: '/ceod/board', icon: Briefcase },
  { name: 'Files & Documents', path: '/ceod/files', icon: FileText },
];

function CEOSidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Memoize isActive to prevent recreation on every render
  const isActive = useCallback((path: string) => {
    if (path === '/ceod/home') {
      return location.pathname === '/ceod/home';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  // Memoize toggleExpanded to prevent recreation
  const toggleExpanded = useCallback((path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  }, []);

  // Memoize expanded state checks using Set for O(1) lookup
  const expandedSet = useMemo(() => new Set(expandedItems), [expandedItems]);

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
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedSet.has(item.path);

          return (
            <div key={item.path}>
              {hasSubItems ? (
                <button
                  onClick={() => toggleExpanded(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-pink-900 text-white shadow-lg'
                      : 'hover:bg-pink-800 text-pink-50'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  {!isCollapsed && (
                    <>
                      <span className="font-medium text-sm flex-1 text-left">{item.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
              ) : (
                <Link
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
              )}

              {hasSubItems && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems!.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const subActive = isActive(subItem.path);
                    return (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all text-sm ${
                          subActive
                            ? 'bg-pink-900 text-white shadow-lg'
                            : 'hover:bg-pink-800 text-pink-100'
                        }`}
                      >
                        <SubIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{subItem.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-pink-800 space-y-2">
        <Link
          to="/ceod/initiatives"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-pink-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Initiatives' : undefined}
        >
          <Target className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium text-sm">Initiatives</span>}
        </Link>

        <Link
          to="/ceod/approvals"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-pink-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Approvals' : undefined}
        >
          <Award className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium text-sm">Approvals</span>}
        </Link>

        {/* Role Switcher */}
        {!isCollapsed && (
          <div className="pt-4 mt-4 border-t border-pink-800">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xs text-pink-100 hover:text-white transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Switch to CTO Portal</span>
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

// Memoize the entire component to prevent unnecessary re-renders from parent
export default memo(CEOSidebar);

