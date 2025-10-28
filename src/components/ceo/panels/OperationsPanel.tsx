import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, AlertTriangle } from 'lucide-react';
import { loadOperationsMetrics } from '@/lib/data/ceo/loaders';

export function OperationsPanel() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['ceo', 'operations-metrics'],
    queryFn: loadOperationsMetrics,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations Dashboard</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">Unable to load operations metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#1a3d97]" />
          Operations Dashboard
        </h3>
        <span className="text-xs text-gray-500">Real-time</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-pink-50 rounded-lg">
          <div className="text-2xl font-bold text-pink-900">
            {metrics.openByQueue.reduce((sum, q) => sum + q.count, 0)}
          </div>
          <div className="text-xs text-pink-600 mt-1">Open Tickets</div>
        </div>
        <div className="text-center p-4 bg-amber-50 rounded-lg">
          <div className="text-2xl font-bold text-amber-900">{metrics.agingOver48h}</div>
          <div className="text-xs text-amber-600 mt-1">Aging &gt; 48h</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-900">{metrics.escalations}</div>
          <div className="text-xs text-red-600 mt-1">Escalations</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Tickets by Queue</h4>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            Avg Resolution: {metrics.avgResolutionTime}h
          </div>
        </div>
        <div className="space-y-2">
          {metrics.openByQueue.map((queue) => {
            const isAging = queue.avgAge > 24;
            return (
              <div key={queue.queue} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{queue.queue}</span>
                    {isAging && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" title="High average age" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{queue.count} open</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Avg Age: {queue.avgAge.toFixed(1)} hours</span>
                  <div className="flex-1 mx-3 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        queue.avgAge > 48
                          ? 'bg-red-500'
                          : queue.avgAge > 24
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((queue.avgAge / 72) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {metrics.escalations > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">
              {metrics.escalations} ticket{metrics.escalations !== 1 ? 's' : ''} require immediate attention
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
