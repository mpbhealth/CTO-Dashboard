import { useState } from 'react';
import { Share2, FileText, BarChart3, Globe } from 'lucide-react';
import { useCurrentProfile, useResources } from '../../../hooks/useDualDashboard';
import { VisibilityBadge } from '../../ui/VisibilityBadge';
import { ShareModal } from '../../modals/ShareModal';
import type { Resource } from '../../../lib/dualDashboard';

export function SharedOverview() {
  const { data: profile } = useCurrentProfile();
  const { data: resources = [] } = useResources({ visibility: 'org_public' });
  const { data: sharedToCTO = [] } = useResources({ visibility: 'shared_to_cto' });
  const { data: sharedToCEO = [] } = useResources({ visibility: 'shared_to_ceo' });

  const [shareModalResource, setShareModalResource] = useState<Resource | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const isCTO = profile?.role === 'cto' || profile?.role === 'admin';
  const isCEO = profile?.role === 'ceo' || profile?.role === 'admin';

  const allSharedResources = [
    ...resources,
    ...(isCTO ? sharedToCTO : []),
    ...(isCEO ? sharedToCEO : []),
  ].filter((resource, index, self) =>
    index === self.findIndex((r) => r.id === resource.id)
  );

  const filteredResources = filterType === 'all'
    ? allSharedResources
    : allSharedResources.filter(r => r.type === filterType);

  const stats = [
    {
      label: 'Organization-Wide',
      value: resources.length,
      icon: Globe,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Shared to CTO',
      value: sharedToCTO.length,
      icon: Share2,
      color: 'bg-blue-100 text-blue-700',
      hidden: !isCTO,
    },
    {
      label: 'Shared to CEO',
      value: sharedToCEO.length,
      icon: Share2,
      color: 'bg-purple-100 text-purple-700',
      hidden: !isCEO,
    },
  ].filter(stat => !stat.hidden);

  const Layout = profile?.role === 'ceo'
    ? require('../../layouts/CEODashboardLayout').CEODashboardLayout
    : require('../../layouts/CTODashboardLayout').CTODashboardLayout;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shared Resources</h1>
          <p className="text-gray-600 mt-1">Organization-wide and cross-workspace shared content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <Icon size={20} className="text-gray-600" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${stat.color}`}>
                    {stat.value} items
                  </span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} />
                All Shared Resources
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Filter:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="file">Files</option>
                  <option value="doc">Documents</option>
                  <option value="kpi">KPIs</option>
                  <option value="campaign">Campaigns</option>
                  <option value="note">Notes</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredResources.length === 0 ? (
              <div className="p-12 text-center">
                <Share2 size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shared resources yet</h3>
                <p className="text-gray-500">
                  Resources shared across workspaces will appear here
                </p>
              </div>
            ) : (
              filteredResources.map((resource) => {
                const typeIcons: Record<string, any> = {
                  file: FileText,
                  doc: FileText,
                  kpi: BarChart3,
                  campaign: Share2,
                  note: FileText,
                };
                const Icon = typeIcons[resource.type || 'file'];

                return (
                  <div key={resource.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon size={20} className="text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{resource.title}</h3>
                            <VisibilityBadge visibility={resource.visibility} />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 capitalize">{resource.type}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(resource.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {resource.created_by === profile?.user_id && (
                          <button
                            onClick={() => setShareModalResource(resource)}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                          >
                            Manage
                          </button>
                        )}
                        <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {shareModalResource && (
        <ShareModal
          resource={shareModalResource}
          onClose={() => setShareModalResource(null)}
        />
      )}
    </Layout>
  );
}
