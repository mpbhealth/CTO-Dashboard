import { motion } from 'framer-motion';
import { 
  Users, 
  Eye, 
  TrendingUp, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useRealTimeAnalytics } from '../../hooks/useWebsiteAnalytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DEVICE_COLORS = {
  desktop: '#3B82F6',
  mobile: '#10B981',
  tablet: '#F59E0B',
};

function formatTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function RealTimeAnalytics() {
  const { data, loading, error, refetch } = useRealTimeAnalytics(30000);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl" />
          ))}
        </div>
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

  const deviceData = [
    { name: 'Desktop', value: data.deviceBreakdown.desktop, color: DEVICE_COLORS.desktop },
    { name: 'Mobile', value: data.deviceBreakdown.mobile, color: DEVICE_COLORS.mobile },
    { name: 'Tablet', value: data.deviceBreakdown.tablet, color: DEVICE_COLORS.tablet },
  ].filter(d => d.value > 0);

  const totalDevices = deviceData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Real-Time Analytics</h2>
            <p className="text-sm text-slate-500">Live website activity • Last updated 0s ago</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <Activity className="w-4 h-4" />
          <span>Live</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 text-sm font-medium">Active Now</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{data.activeNow}</span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <p className="text-sm text-slate-500 mt-1">visitors in last 5 min</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 text-sm font-medium">Page Views</span>
            <Eye className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-3xl font-bold text-slate-900">{data.pageViewsLast5Min}</span>
          <p className="text-sm text-slate-500 mt-1">in last 5 minutes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 text-sm font-medium">Top Page</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <span className="text-xl font-bold text-slate-900 truncate block">
            {data.topPage?.path || '-'}
          </span>
          <p className="text-sm text-slate-500 mt-1">
            {data.topPage ? `${data.topPage.views} views right now` : 'No active pages'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-xl text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-emerald-100 text-sm font-medium">Locations</span>
            <Globe className="w-5 h-5 text-emerald-200" />
          </div>
          <span className="text-3xl font-bold">{data.activeCountries}</span>
          <p className="text-sm text-emerald-100 mt-1">countries active now</p>
        </motion.div>
      </div>

      {/* Live Activity Feed & Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Live Activity Feed</h3>
            </div>
            <span className="text-sm text-slate-500">Showing last 20 views</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {data.recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Eye className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-6 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Eye className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-500">{activity.path}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {activity.country}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Devices & Locations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm"
        >
          {/* Devices */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Devices</h3>
            </div>
          </div>
          <div className="p-4">
            {totalDevices === 0 ? (
              <p className="text-center text-slate-500 py-4">No device data</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-600">Desktop</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {data.deviceBreakdown.desktop} ({totalDevices > 0 ? Math.round((data.deviceBreakdown.desktop / totalDevices) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-slate-600">Mobile</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {data.deviceBreakdown.mobile} ({totalDevices > 0 ? Math.round((data.deviceBreakdown.mobile / totalDevices) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tablet className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-slate-600">Tablet</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {data.deviceBreakdown.tablet} ({totalDevices > 0 ? Math.round((data.deviceBreakdown.tablet / totalDevices) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Active Locations */}
          <div className="px-6 py-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Active Locations</h3>
            </div>
            {data.activeLocations.length === 0 ? (
              <p className="text-sm text-slate-500">No location data</p>
            ) : (
              <div className="space-y-2">
                {data.activeLocations.slice(0, 5).map((loc) => (
                  <div key={loc.country} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{loc.country}</span>
                    <span className="text-sm font-medium text-slate-900">{loc.count} visitors</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
