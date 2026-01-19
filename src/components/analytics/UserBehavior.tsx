import { motion } from 'framer-motion';
import { 
  MousePointer2, 
  Clock, 
  Layers, 
  Eye,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useUserBehavior, formatDuration } from '../../hooks/useWebsiteAnalytics';

interface Props {
  dateRange: string;
}

function formatChange(change: number, invert = false): { text: string; isGood: boolean } {
  const isPositive = change >= 0;
  const isGood = invert ? !isPositive : isPositive;
  const text = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
  return { text, isGood };
}

export default function UserBehavior({ dateRange }: Props) {
  const { data, loading, error, refetch } = useUserBehavior(dateRange);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
      title: 'Bounce Rate',
      value: `${data.bounceRate.toFixed(1)}%`,
      change: formatChange(data.bounceRateChange, true), // Lower is better
      icon: TrendingDown,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
    },
    {
      title: 'Avg. Duration',
      value: formatDuration(data.avgDuration),
      change: formatChange(data.avgDurationChange),
      icon: Clock,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pages/Session',
      value: data.pagesPerSession.toFixed(2),
      change: formatChange(data.pagesPerSessionChange),
      icon: Layers,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Total Views',
      value: data.totalViews >= 1000 
        ? `${(data.totalViews / 1000).toFixed(1)}K` 
        : data.totalViews.toString(),
      change: formatChange(data.totalViewsChange),
      icon: Eye,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  // Prepare chart data (prefixed with _ as it's prepared for future use)
  const _chartData = data.mostVisitedPages.slice(0, 8).map(page => ({
    name: page.title.length > 40 ? page.title.substring(0, 40) + '...' : page.title,
    views: page.views,
    fullTitle: page.title,
    path: page.path,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <MousePointer2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">User Behavior</h2>
            <p className="text-sm text-slate-500">Understand how visitors interact with your site</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
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
                  kpi.change.isGood ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {kpi.change.text.startsWith('+') ? (
                    <ArrowUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-0.5" />
                  )}
                  {kpi.change.text}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Most Visited Pages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Most Visited Pages</h3>
        </div>
        
        {data.mostVisitedPages.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <p>No page data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.mostVisitedPages.slice(0, 10).map((page, index) => {
              const maxViews = data.mostVisitedPages[0]?.views || 1;
              const widthPercent = (page.views / maxViews) * 100;
              
              return (
                <motion.div
                  key={page.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900 truncate max-w-md" title={page.title}>
                      {page.title}
                    </p>
                    <span className="text-sm font-semibold text-slate-700 ml-4">
                      {page.views}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.05 }}
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
