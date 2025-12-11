import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Eye, 
  Clock, 
  TrendingDown,
  Users,
  UserPlus,
  UserCheck,
  Layers,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { useAnalyticsOverview, formatDuration } from '../../hooks/useWebsiteAnalytics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface Props {
  dateRange: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatChange(change: number): { text: string; isPositive: boolean } {
  const isPositive = change >= 0;
  const text = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
  return { text, isPositive };
}

export default function AnalyticsOverviewSection({ dateRange }: Props) {
  const { data, loading, error, refetch } = useAnalyticsOverview(dateRange);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    {
      title: 'Sessions',
      value: formatNumber(data.sessions),
      change: formatChange(data.sessionsChange),
      subtext: `+${formatNumber(data.sessions)} vs 0 previous`,
      icon: BarChart3,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Page Views',
      value: formatNumber(data.pageViews),
      change: formatChange(data.pageViewsChange),
      subtext: `+${formatNumber(data.pageViews)} vs 0 previous`,
      icon: Eye,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Avg. Duration',
      value: formatDuration(data.avgDuration),
      change: formatChange(data.avgDurationChange),
      subtext: 'vs 0s previous',
      icon: Clock,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Bounce Rate',
      value: `${data.bounceRate.toFixed(1)}%`,
      change: formatChange(data.bounceRateChange),
      subtext: 'vs 0.0% previous',
      icon: TrendingDown,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      invertChange: true, // Lower is better for bounce rate
    },
  ];

  const secondaryKpis = [
    {
      title: 'Users',
      value: formatNumber(data.users),
      change: formatChange(data.usersChange),
      icon: Users,
    },
    {
      title: 'New Users',
      value: formatNumber(data.newUsers),
      change: formatChange(data.newUsersChange),
      icon: UserPlus,
    },
    {
      title: 'Returning Users',
      value: formatNumber(data.returningUsers),
      change: null,
      icon: UserCheck,
    },
    {
      title: 'Pages/Session',
      value: data.pagesPerSession.toFixed(2),
      change: formatChange(data.pagesPerSessionChange),
      icon: Layers,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Analytics Overview</h2>
            <p className="text-sm text-slate-500">Track traffic, behavior, and performance metrics</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          const changeIsGood = kpi.invertChange ? !kpi.change.isPositive : kpi.change.isPositive;
          
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">{kpi.title}</span>
                <div className={`w-8 h-8 ${kpi.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
                <span className={`flex items-center text-sm font-medium ${
                  changeIsGood ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {kpi.change.isPositive ? (
                    <ArrowUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-0.5" />
                  )}
                  {kpi.change.text}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{kpi.subtext}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {secondaryKpis.map((kpi, index) => {
          const Icon = kpi.icon;
          
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{kpi.title}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">{kpi.value}</span>
                {kpi.change && (
                  <span className={`flex items-center text-xs font-medium ${
                    kpi.change.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {kpi.change.isPositive ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {kpi.change.text}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sessions Over Time Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">Sessions Over Time</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-sm text-slate-600">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="text-sm text-slate-600">Previous</span>
            </div>
          </div>
        </div>
        
        {data.sessionsOverTime.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <p>No session data available for the selected period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.sessionsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748B"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="current"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                name="Current Period"
              />
              <Line
                type="monotone"
                dataKey="previous"
                stroke="#CBD5E1"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#CBD5E1', strokeWidth: 2, r: 3 }}
                name="Previous Period"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  );
}
