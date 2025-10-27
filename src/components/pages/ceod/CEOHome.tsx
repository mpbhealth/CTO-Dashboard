import { useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  CheckCircle,
  Share2,
  FileText,
} from 'lucide-react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';
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
    document.documentElement.dataset.role = 'ceo';
    console.log('CEOHome mounted - Profile:', profile?.display_name);
  }, [profile]);

  const LoadingFallback = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
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

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good morning, {profile?.display_name || 'Catherine'}
          </h1>
          <p className="text-gray-600 mt-1">Here's your executive overview</p>
        </div>

        <CEOErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ExecutiveOverviewPanel />
          </Suspense>
        </CEOErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target size={20} />
                  Top Priorities
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {priorities.map((priority, index) => {
                  const statusColors = {
                    green: 'bg-green-100 text-green-700',
                    blue: 'bg-blue-100 text-blue-700',
                    yellow: 'bg-yellow-100 text-yellow-700',
                  };
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{priority.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">Owner: {priority.owner}</p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            statusColors[priority.statusColor as keyof typeof statusColors]
                          }`}
                        >
                          {priority.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${priority.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {priority.progress}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Share2 size={20} className="text-[#1a3d97]" />
                  Shared from CTO
                </h2>
                <p className="text-sm text-gray-500 mt-1">Resources shared with you by the CTO team</p>
              </div>
              {sharedFromCTO.length === 0 ? (
                <div className="p-8 text-center">
                  <Share2 className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">No resources shared yet</p>
                  <p className="text-xs text-gray-400 mt-1">CTO can share files and reports with you</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sharedFromCTO.map((resource) => (
                    <div key={resource.id} className="p-4 hover:bg-blue-50 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#1a3d97] to-[#00A896] flex items-center justify-center">
                              <FileText size={16} className="text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{resource.title}</h3>
                              <span className="text-xs text-gray-500 capitalize">
                                {resource.type} • Shared on {new Date(resource.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <TrendingUp size={20} />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link to="/ceod/marketing" className="block w-full text-left px-4 py-3 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
                  View Marketing
                </Link>
                <Link to="/ceod/sales/reports" className="block w-full text-left px-4 py-3 bg-blue-50 text-[#1a3d97] rounded-lg hover:bg-blue-100 transition-colors font-medium">
                  Sales Reports
                </Link>
                <Link to="/ceod/board" className="block w-full text-left px-4 py-3 bg-blue-50 text-[#1a3d97] rounded-lg hover:bg-blue-100 transition-colors font-medium">
                  Board Packet
                </Link>
                <Link to="/ceod/operations/overview" className="block w-full text-left px-4 py-3 bg-blue-50 text-[#1a3d97] rounded-lg hover:bg-blue-100 transition-colors font-medium">
                  Operations
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a3d97] to-[#00A896] rounded-xl shadow-sm p-6 text-white">
              <CheckCircle size={32} className="mb-3" />
              <h3 className="font-semibold text-lg mb-2">Company Health</h3>
              <p className="text-white/80 text-sm mb-4">Strong performance across all metrics</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Revenue Growth</span>
                  <span className="font-semibold">+12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Team Satisfaction</span>
                  <span className="font-semibold">8.7/10</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">UPCOMING</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Board Meeting</p>
                    <p className="text-xs text-gray-500">Tomorrow, 2:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Marketing Review</p>
                    <p className="text-xs text-gray-500">Friday, 10:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {shareModalResource && (
        <ShareModal
          resource={shareModalResource}
          onClose={() => setShareModalResource(null)}
        />
      )}
    </div>
  );
}
