import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, TrendingUp, Award } from 'lucide-react';
import { loadSalesMetrics } from '@/lib/data/ceo/loaders';

export function SalesPanel() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['ceo', 'sales-metrics'],
    queryFn: loadSalesMetrics,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Pipeline</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">Unable to load sales metrics.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#1a3d97]" />
          Sales Pipeline
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-600">{metrics.closeRate}%</span>
          <span className="text-gray-500">Close Rate</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-4 gap-3">
          {metrics.pipeline.map((stage, index) => {
            const colors = ['blue', 'indigo', 'purple', 'green'];
            const color = colors[index];
            return (
              <div key={stage.stage} className={`bg-${color}-50 rounded-lg p-3 border border-${color}-200`}>
                <div className={`text-xl font-bold text-${color}-900`}>{stage.count}</div>
                <div className={`text-xs text-${color}-600 mt-1`}>{stage.stage}</div>
                <div className={`text-xs text-${color}-700 font-medium mt-1`}>
                  {formatCurrency(stage.value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          Top Advisors This Month
        </h4>
        <div className="space-y-2">
          {metrics.topAdvisors.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">No advisor data available</div>
          ) : (
            metrics.topAdvisors.map((advisor, index) => (
              <div
                key={advisor.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0
                        ? 'bg-amber-500'
                        : index === 1
                        ? 'bg-gray-400'
                        : index === 2
                        ? 'bg-orange-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{advisor.name}</p>
                    <p className="text-xs text-gray-500">
                      {advisor.enrollments} enrollments • {advisor.closeRate}% close rate
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 text-sm">
                    {formatCurrency(advisor.revenue)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
