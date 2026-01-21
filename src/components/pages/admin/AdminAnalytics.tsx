import {
  BarChart3,
  Users,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Calendar,
  Download,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
          isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
      </div>
    </div>
  );
}

export function AdminAnalytics() {
  const metrics: MetricCardProps[] = [
    { title: 'Total Visitors', value: '124,892', change: 12.5, icon: Users, color: 'from-blue-500 to-blue-600' },
    { title: 'Page Views', value: '542,831', change: 8.2, icon: Eye, color: 'from-purple-500 to-purple-600' },
    { title: 'Avg. Session Duration', value: '4:32', change: -2.1, icon: Clock, color: 'from-amber-500 to-amber-600' },
    { title: 'Bounce Rate', value: '34.2%', change: -5.4, icon: ArrowUpRight, color: 'from-emerald-500 to-emerald-600' },
  ];

  const topPages = [
    { page: '/benefits', views: 45234, change: 12 },
    { page: '/pricing', views: 38921, change: 8 },
    { page: '/member-portal', views: 32456, change: -3 },
    { page: '/contact', views: 28734, change: 15 },
    { page: '/about', views: 21543, change: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Overview</h1>
          <p className="text-slate-500 mt-1">Website performance metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Traffic Overview</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Traffic chart visualization</p>
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top Pages</h3>
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <div key={page.page} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-100 rounded-full">
                    {index + 1}
                  </span>
                  <span className="font-medium text-slate-900">{page.page}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">{page.views.toLocaleString()} views</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    page.change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {page.change >= 0 ? '+' : ''}{page.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
