import { motion } from 'framer-motion';
import { 
  Globe, 
  Link2, 
  Search, 
  Share2, 
  DollarSign, 
  Mail,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { useTrafficSources } from '../../hooks/useWebsiteAnalytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  dateRange: string;
}

const SOURCE_ICONS: Record<string, typeof Globe> = {
  Direct: Link2,
  Organic: Search,
  Social: Share2,
  Referral: Globe,
  Paid: DollarSign,
  Email: Mail,
};

const SOURCE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Direct: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
  Organic: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-500' },
  Social: { bg: 'bg-pink-100', text: 'text-pink-600', icon: 'text-pink-500' },
  Referral: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-500' },
  Paid: { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'text-amber-500' },
  Email: { bg: 'bg-teal-100', text: 'text-teal-600', icon: 'text-teal-500' },
};

export default function TrafficSources({ dateRange }: Props) {
  const { data, loading, error, refetch } = useTrafficSources(dateRange);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-xl" />
          <div className="h-80 bg-slate-200 rounded-xl" />
        </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Traffic Analytics</h2>
            <p className="text-sm text-slate-500">Understand where your visitors come from</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Distribution Donut Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Traffic Distribution</h3>
          
          {data.distribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <p>No traffic data available</p>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={data.distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {data.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Sessions']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-slate-900">{data.total}</span>
                  <span className="text-sm text-slate-500">Total</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                {data.distribution.map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-sm text-slate-600">{source.source}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {source.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Source Performance Table */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Source Performance</h3>
          
          {data.sourcePerformance.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <p>No performance data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.sourcePerformance.map((source, index) => {
                const Icon = SOURCE_ICONS[source.source] || Globe;
                const colors = SOURCE_COLORS[source.source] || SOURCE_COLORS.Referral;
                
                return (
                  <motion.div
                    key={source.source}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{source.source}</p>
                        <p className="text-sm text-slate-500">
                          {source.percentageOfTotal.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{source.sessions}</p>
                      <p className={`flex items-center justify-end text-sm font-medium ${
                        source.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {source.change >= 0 ? (
                          <ArrowUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <ArrowDown className="w-3 h-3 mr-0.5" />
                        )}
                        {source.change >= 0 ? '+' : ''}{source.change.toFixed(1)}%
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
