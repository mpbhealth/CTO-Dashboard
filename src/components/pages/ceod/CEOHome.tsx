import { useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  CheckCircle,
  Share2,
  FileText,
  Upload,
  ChevronRight,
} from 'lucide-react';
import { useCurrentProfile, useResources, useWorkspace } from '../../../hooks/useDualDashboard';
import { ShareModal } from '../../modals/ShareModal';
import { CEOErrorBoundary } from '../../ceo/ErrorBoundary';
import { ExecutiveOverviewPanel } from '../../ceo/panels/ExecutiveOverviewPanel';
import { ConciergePanel } from '../../ceo/panels/ConciergePanel';
import { SalesPanel } from '../../ceo/panels/SalesPanel';
import { OperationsPanel } from '../../ceo/panels/OperationsPanel';
import { FinancePanel } from '../../ceo/panels/FinancePanel';
import { CompliancePanel } from '../../ceo/panels/CompliancePanel';
import type { Resource } from '../../../lib/dualDashboard';

export function CEOHome() {
  const { data: profile } = useCurrentProfile();
  const { data: workspace } = useWorkspace(
    profile?.org_id || '',
    'CEO',
    'CEO Workspace'
  );
  const { data: resources = [] } = useResources({
    workspaceId: workspace?.id,
  });

  const [shareModalResource, setShareModalResource] = useState<Resource | null>(null);

  useEffect(() => {
    if (profile?.role) {
      document.documentElement.dataset.role = profile.role;
    }
  }, [profile]);

  const LoadingFallback = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-20 bg-slate-200 rounded"></div>
      </div>
    </div>
  );

  const priorities = [
    {
      title: 'Q4 Marketing Campaign Launch',
      owner: 'Marketing Team',
      status: 'On Track',
      progress: 75,
      statusColor: 'green',
    },
    {
      title: 'Board Meeting Preparation',
      owner: 'You',
      status: 'In Progress',
      progress: 60,
      statusColor: 'blue',
    },
    {
      title: 'New Product Feature Rollout',
      owner: 'CTO',
      status: 'At Risk',
      progress: 45,
      statusColor: 'yellow',
    },
  ];

  const sharedFromCTO = resources.filter((r) => r.visibility === 'shared_to_ceo').slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header - Stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            {getGreeting()}, {profile?.display_name || 'Catherine'}!
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Welcome to your executive command center.
          </p>
        </div>
        <Link
          to="/ceod/upload"
          className="
            inline-flex items-center justify-center gap-2 
            px-4 sm:px-6 py-3 
            bg-gradient-to-r from-indigo-500 to-indigo-600 
            text-white rounded-xl 
            hover:from-indigo-600 hover:to-indigo-700
            active:scale-[0.98]
            transition-all duration-200 
            shadow-lg shadow-indigo-500/20
            font-medium text-sm sm:text-base
            min-h-[44px]
            touch-manipulation
            w-full sm:w-auto
          "
        >
          <Upload size={18} />
          <span>Upload Data</span>
        </Link>
      </div>

      {/* Executive Overview Panel */}
      <CEOErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ExecutiveOverviewPanel />
        </Suspense>
      </CEOErrorBoundary>

      {/* Department Panels - 2 column on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <CEOErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ConciergePanel />
          </Suspense>
        </CEOErrorBoundary>

        <CEOErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <SalesPanel />
          </Suspense>
        </CEOErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <CEOErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <OperationsPanel />
          </Suspense>
        </CEOErrorBoundary>

        <CEOErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <FinancePanel />
          </Suspense>
        </CEOErrorBoundary>
      </div>

      <CEOErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <CompliancePanel />
        </Suspense>
      </CEOErrorBoundary>

      {/* Bottom section - 3 column on large screens, stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Top Priorities Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target size={20} className="text-indigo-500" />
                Top Priorities
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {priorities.map((priority, index) => {
                const statusColors = {
                  green: 'bg-green-100 text-green-700',
                  blue: 'bg-indigo-100 text-indigo-700',
                  yellow: 'bg-yellow-100 text-yellow-700',
                };
                return (
                  <div 
                    key={index} 
                    className="
                      border border-gray-200 rounded-xl p-3 sm:p-4
                      hover:border-indigo-200 hover:bg-indigo-50/30
                      transition-colors duration-200
                      touch-manipulation
                    "
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {priority.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          Owner: {priority.owner}
                        </p>
                      </div>
                      <span
                        className={`
                          text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap
                          ${statusColors[priority.statusColor as keyof typeof statusColors]}
                        `}
                      >
                        {priority.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${priority.progress}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 w-10 text-right">
                        {priority.progress}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shared from CTO Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Share2 size={20} className="text-indigo-500" />
                Shared from CTO
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Resources shared with you by the CTO team
              </p>
            </div>
            {sharedFromCTO.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <Share2 className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 text-sm">No resources shared yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  CTO can share files and reports with you
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sharedFromCTO.map((resource) => (
                  <div 
                    key={resource.id} 
                    className="
                      p-4 hover:bg-indigo-50 
                      transition-colors duration-200 
                      group touch-manipulation
                      active:bg-indigo-100
                    "
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {resource.title}
                          </h3>
                          <span className="text-xs text-gray-500 capitalize">
                            {resource.type} • {new Date(resource.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button className="
                        px-3 py-2 
                        bg-gradient-to-r from-indigo-500 to-indigo-600 
                        text-white rounded-lg text-sm font-medium 
                        opacity-90 group-hover:opacity-100 
                        transition-all duration-200
                        active:scale-95
                        min-h-[36px]
                        touch-manipulation
                        flex-shrink-0
                      ">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-indigo-500" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link 
                to="/ceod/marketing" 
                className="
                  flex items-center justify-between
                  w-full px-4 py-3 
                  bg-gradient-to-r from-indigo-500 to-indigo-600 
                  text-white rounded-xl 
                  hover:from-indigo-600 hover:to-indigo-700
                  active:scale-[0.98]
                  transition-all duration-200 
                  font-medium text-sm
                  min-h-[44px]
                  touch-manipulation
                "
              >
                <span>View Marketing</span>
                <ChevronRight size={18} />
              </Link>
              <Link 
                to="/ceod/sales/reports" 
                className="
                  flex items-center justify-between
                  w-full px-4 py-3 
                  bg-indigo-50 text-indigo-600 rounded-xl 
                  hover:bg-indigo-100 
                  active:bg-indigo-200 active:scale-[0.98]
                  transition-all duration-200 
                  font-medium text-sm
                  min-h-[44px]
                  touch-manipulation
                "
              >
                <span>Sales Reports</span>
                <ChevronRight size={18} />
              </Link>
              <Link 
                to="/ceod/board" 
                className="
                  flex items-center justify-between
                  w-full px-4 py-3 
                  bg-indigo-50 text-indigo-600 rounded-xl 
                  hover:bg-indigo-100 
                  active:bg-indigo-200 active:scale-[0.98]
                  transition-all duration-200 
                  font-medium text-sm
                  min-h-[44px]
                  touch-manipulation
                "
              >
                <span>Board Packet</span>
                <ChevronRight size={18} />
              </Link>
              <Link 
                to="/ceod/operations/overview" 
                className="
                  flex items-center justify-between
                  w-full px-4 py-3 
                  bg-indigo-50 text-indigo-600 rounded-xl 
                  hover:bg-indigo-100 
                  active:bg-indigo-200 active:scale-[0.98]
                  transition-all duration-200 
                  font-medium text-sm
                  min-h-[44px]
                  touch-manipulation
                "
              >
                <span>Operations</span>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          {/* Company Health Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <CheckCircle size={28} className="mb-3" />
            <h3 className="font-semibold text-lg mb-2">Company Health</h3>
            <p className="text-indigo-100 text-sm mb-4">
              Strong performance across all metrics
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-t border-white/20">
                <span className="text-indigo-100">Revenue Growth</span>
                <span className="font-semibold">+12%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-white/20">
                <span className="text-indigo-100">Team Satisfaction</span>
                <span className="font-semibold">8.7/10</span>
              </div>
            </div>
          </div>

          {/* Upcoming Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Upcoming
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Board Meeting</p>
                  <p className="text-xs text-gray-500">Tomorrow, 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Marketing Review</p>
                  <p className="text-xs text-gray-500">Friday, 10:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalResource && (
        <ShareModal
          resource={shareModalResource}
          onClose={() => setShareModalResource(null)}
        />
      )}
    </div>
  );
}
