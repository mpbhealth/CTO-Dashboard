import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { loadFinanceMetrics } from '@/lib/data/ceo/loaders';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function FinancePanel() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['ceo', 'finance-metrics'],
    queryFn: loadFinanceMetrics,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Finance Snapshot</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">Unable to load finance metrics.</p>
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

  const chartData = metrics.trendData.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.revenue - item.expenses,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#1a3d97]" />
          Finance Snapshot
        </h3>
        <span className="text-xs text-gray-500">Last 4 months</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center gap-1 text-green-700 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">AR</span>
          </div>
          <div className="text-xl font-bold text-green-900">
            {formatCurrency(metrics.accountsReceivable)}
          </div>
        </div>
        <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-center gap-1 text-amber-700 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium">AP</span>
          </div>
          <div className="text-xl font-bold text-amber-900">
            {formatCurrency(metrics.accountsPayable)}
          </div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center gap-1 text-blue-700 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Payouts</span>
          </div>
          <div className="text-xl font-bold text-blue-900">
            {formatCurrency(metrics.payoutsThisMonth)}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Revenue vs Expenses Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
