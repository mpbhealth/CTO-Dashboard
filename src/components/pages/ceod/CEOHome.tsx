import { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Share2,
  FileText,
} from 'lucide-react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';
import { useCurrentProfile, useResources, useWorkspace } from '../../../hooks/useDualDashboard';
import { VisibilityBadge } from '../../ui/VisibilityBadge';
import { ShareModal } from '../../modals/ShareModal';
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

  const kpis = [
    {
      label: 'MRR',
      value: '$847K',
      trend: '+12%',
      status: 'success',
      icon: DollarSign,
    },
    {
      label: 'Active Members',
      value: '3,247',
      trend: '+8%',
      status: 'success',
      icon: Users,
    },
    {
      label: 'CAC',
      value: '$124',
      trend: '-6%',
      status: 'success',
      icon: Target,
    },
    {
      label: 'Churn Rate',
      value: '2.1%',
      trend: '+0.3%',
      status: 'warning',
      icon: AlertTriangle,
    },
  ];

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
    <CEODashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good morning, {profile?.display_name || 'Catherine'}
          </h1>
          <p className="text-gray-600 mt-1">Here's your executive overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const statusColors = {
              success: 'bg-green-100 text-green-700',
              warning: 'bg-yellow-100 text-yellow-700',
              neutral: 'bg-blue-100 text-blue-700',
            };
            return (
              <div
                key={kpi.label}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon size={20} className="text-gray-600" />
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      statusColors[kpi.status as keyof typeof statusColors]
                    }`}
                  >
                    {kpi.trend}
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                <div className="text-sm text-gray-500">{kpi.label}</div>
              </div>
            );
          })}
        </div>

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

            {sharedFromCTO.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Share2 size={20} />
                    Shared from CTO
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {sharedFromCTO.map((resource) => (
                    <div key={resource.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-gray-400" />
                            <h3 className="font-medium text-gray-900">{resource.title}</h3>
                          </div>
                          <span className="text-xs text-gray-500 capitalize mt-1 inline-block">
                            {resource.type}
                          </span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <TrendingUp size={20} />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium">
                  View Marketing
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Board Packet
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Initiatives
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white">
              <CheckCircle size={32} className="mb-3" />
              <h3 className="font-semibold text-lg mb-2">Company Health</h3>
              <p className="text-green-100 text-sm mb-4">Strong performance across all metrics</p>
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
      </div>

      {shareModalResource && (
        <ShareModal
          resource={shareModalResource}
          onClose={() => setShareModalResource(null)}
        />
      )}
    </CEODashboardLayout>
  );
}
