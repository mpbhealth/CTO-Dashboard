import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { loadConciergeMetrics } from '@/lib/data/ceo/loaders';

export const ConciergePanel = memo(function ConciergePanel() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['ceo', 'concierge-metrics'],
    queryFn: loadConciergeMetrics,
    staleTime: 2 * 60 * 1000,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Concierge Tracking</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">Unable to load concierge metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#1a3d97]" />
          Concierge Tracking
        </h3>
        <span className="text-xs text-gray-500">Last 24 hours</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-pink-50 rounded-lg">
          <div className="text-2xl font-bold text-pink-900">{metrics.ticketsToday}</div>
          <div className="text-xs text-pink-500 mt-1">Tickets Today</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-900">{metrics.slaMetPercent}%</div>
          <div className="text-xs text-green-600 mt-1">SLA Met</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-900">{metrics.avgFirstReplyTime}m</div>
          <div className="text-xs text-purple-600 mt-1">Avg Reply Time</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h4>
        <div className="space-y-3">
          {metrics.recentNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No recent activity
            </div>
          ) : (
            metrics.recentNotes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{note.member}</p>
                    <p className="text-xs text-gray-500">{note.agent}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(note.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{note.note}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
