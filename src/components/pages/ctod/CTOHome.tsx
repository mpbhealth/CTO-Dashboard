import { useState } from 'react';
import {
  FileText,
  BarChart3,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Share2,
} from 'lucide-react';
import { useCurrentProfile, useResources, useWorkspace } from '../../../hooks/useDualDashboard';
import { VisibilityBadge } from '../../ui/VisibilityBadge';
import { ShareModal } from '../../modals/ShareModal';
import type { Resource } from '../../../lib/dualDashboard';

export function CTOHome() {
  const { data: profile } = useCurrentProfile();
  const { data: workspace } = useWorkspace(
    profile?.org_id || '',
    'CTO',
    'CTO Workspace'
  );
  const { data: resources = [] } = useResources({
    workspaceId: workspace?.id,
  });

  const [shareModalResource, setShareModalResource] = useState<Resource | null>(null);

  const kpis = [
    {
      label: 'System Uptime',
      value: '99.9%',
      trend: '+0.1%',
      status: 'success',
      icon: TrendingUp,
    },
    {
      label: 'Open Issues',
      value: '12',
      trend: '-3',
      status: 'warning',
      icon: AlertCircle,
    },
    {
      label: 'Deployments (30d)',
      value: '47',
      trend: '+8',
      status: 'success',
      icon: CheckCircle,
    },
    {
      label: 'Shared Resources',
      value: resources.filter((r) => r.visibility !== 'private').length.toString(),
      trend: '+2',
      status: 'neutral',
      icon: Share2,
    },
  ];

  const recentResources = resources.slice(0, 5);

  const isCEOUser = profile?.role === 'ceo' || profile?.role === 'admin';

  return (
    <div className="w-full h-full">
      <div className="space-y-8">
        <div>
          {isCEOUser ? (
            <>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                CEO Dashboard — CTO Technology Overview
              </h1>
              <p className="text-gray-600 mt-1">Viewing CTO operations and technology metrics</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {profile?.display_name || 'Vinnie'}
              </h1>
              <p className="text-gray-600 mt-1">Here's your technology overview</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const statusColors = {
              success: 'bg-green-100 text-green-700',
              warning: 'bg-yellow-100 text-yellow-700',
              neutral: 'bg-indigo-100 text-indigo-700',
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
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} />
                Recent Resources
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentResources.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No resources yet</p>
                  <p className="text-sm mt-1">Upload files or create documents to get started</p>
                </div>
              ) : (
                recentResources.map((resource) => (
                  <div key={resource.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{resource.title}</h3>
                          <VisibilityBadge visibility={resource.visibility} />
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 capitalize">{resource.type}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(resource.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShareModalResource(resource)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Share2 size={14} />
                        Share
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <BarChart3 size={20} />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium">
                  Upload File
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  View KPIs
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Check Compliance
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
              <Shield size={32} className="mb-3" />
              <h3 className="font-semibold text-lg mb-2">Security Status</h3>
              <p className="text-indigo-100 text-sm mb-4">All systems secure. No alerts.</p>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={16} />
                <span>Last audit: 3 days ago</span>
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
