import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, TrendingDown, FileCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { loadExecutiveKPIs } from '@/lib/data/ceo/loaders';

export function ExecutiveOverviewPanel() {
  const { data: kpis, isLoading, error } = useQuery({
    queryKey: ['ceo', 'executive-kpis'],
    queryFn: loadExecutiveKPIs,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">Unable to load executive KPIs. Please try again later.</p>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Monthly Recurring Revenue',
      value: `$${(kpis.mrr.current / 1000).toFixed(0)}K`,
      change: kpis.mrr.change,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'New Members',
      value: kpis.newMembers.current.toString(),
      change: kpis.newMembers.change,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Churn Rate',
      value: `${kpis.churn.current.toFixed(1)}%`,
      change: kpis.churn.change,
      icon: TrendingDown,
      color: 'from-amber-500 to-amber-600',
      invertChange: true,
    },
    {
      label: 'Claims Paid',
      value: kpis.claimsPaid.current.toString(),
      change: kpis.claimsPaid.change,
      icon: FileCheck,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const isPositive = metric.invertChange ? metric.change < 0 : metric.change > 0;

        return (
          <div
            key={metric.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-[#1a3d97] transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-gradient-to-br ${metric.color} rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div
                className={`flex items-center space-x-1 ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
                <span className="font-semibold text-sm">
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{metric.label}</h3>
            <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
          </div>
        );
      })}
    </div>
  );
}
