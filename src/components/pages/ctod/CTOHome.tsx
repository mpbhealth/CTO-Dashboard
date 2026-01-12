import { useState } from 'react';
import {
  FileText,
  BarChart3,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Share2,
  ChevronRight,
  Upload,
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
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="px-1">
          {isCEOUser ? (
            <>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                CEO Dashboard — CTO Technology Overview
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Viewing CTO operations and technology metrics
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Welcome back, {profile?.display_name || 'Vinnie'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Here's your technology overview
              </p>
            </>
          )}
        </div>

        {/* KPI Cards - Responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
                className="
                  bg-white rounded-xl shadow-sm 
                  border border-slate-200 
                  p-4 sm:p-5 md:p-6
                  hover:border-sky-200 hover:shadow-md
                  transition-all duration-200
                  touch-manipulation
                "
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                    <Icon size={16} className="text-gray-600 sm:w-5 sm:h-5" />
                  </div>
                  <span
                    className={`
                      text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full
                      ${statusColors[kpi.status as keyof typeof statusColors]}
                    `}
                  >
                    {kpi.trend}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                  {kpi.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">
                  {kpi.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Resources Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-indigo-500" />
                Recent Resources
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentResources.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-gray-500">
                  <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No resources yet</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Upload files or create documents to get started
                  </p>
                </div>
              ) : (
                recentResources.map((resource) => (
                  <div 
                    key={resource.id} 
                    className="
                      p-3 sm:p-4 
                      hover:bg-gray-50 active:bg-gray-100
                      transition-colors duration-200
                      touch-manipulation
                    "
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {resource.title}
                          </h3>
                          <VisibilityBadge visibility={resource.visibility} />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1">
                          <span className="text-xs text-gray-500 capitalize">
                            {resource.type}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(resource.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShareModalResource(resource)}
                        className="
                          flex items-center gap-1.5 sm:gap-2 
                          px-2.5 sm:px-3 py-2 
                          text-xs sm:text-sm text-indigo-600 
                          hover:bg-indigo-50 active:bg-indigo-100
                          rounded-lg transition-colors
                          min-h-[36px]
                          touch-manipulation
                          flex-shrink-0
                        "
                      >
                        <Share2 size={14} />
                        <span className="hidden xs:inline">Share</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-indigo-500" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button 
                  className="
                    flex items-center justify-between
                    w-full px-4 py-3 
                    bg-sky-50 text-sky-700 rounded-lg 
                    hover:bg-sky-100 active:bg-sky-200
                    active:scale-[0.98]
                    transition-all duration-200 
                    font-medium text-sm
                    min-h-[44px]
                    touch-manipulation
                  "
                >
                  <span className="flex items-center gap-2">
                    <Upload size={16} />
                    Upload File
                  </span>
                  <ChevronRight size={16} />
                </button>
                <button 
                  className="
                    flex items-center justify-between
                    w-full px-4 py-3 
                    bg-slate-50 text-slate-700 rounded-lg 
                    hover:bg-slate-100 active:bg-slate-200
                    active:scale-[0.98]
                    transition-all duration-200 
                    font-medium text-sm
                    min-h-[44px]
                    touch-manipulation
                  "
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 size={16} />
                    View KPIs
                  </span>
                  <ChevronRight size={16} />
                </button>
                <button 
                  className="
                    flex items-center justify-between
                    w-full px-4 py-3 
                    bg-slate-50 text-slate-700 rounded-lg 
                    hover:bg-slate-100 active:bg-slate-200
                    active:scale-[0.98]
                    transition-all duration-200 
                    font-medium text-sm
                    min-h-[44px]
                    touch-manipulation
                  "
                >
                  <span className="flex items-center gap-2">
                    <Shield size={16} />
                    Check Compliance
                  </span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Security Status Card */}
            <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
              <Shield size={28} className="mb-3" />
              <h3 className="font-semibold text-base sm:text-lg mb-2">Security Status</h3>
              <p className="text-blue-100 text-sm mb-4">
                All systems secure. No alerts.
              </p>
              <div className="flex items-center gap-2 text-sm pt-3 border-t border-white/20">
                <CheckCircle size={16} />
                <span>Last audit: 3 days ago</span>
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
