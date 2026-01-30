import { useState, useEffect } from 'react';
import {
  Activity,
  Eye,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface LiveVisitor {
  id: string;
  page: string;
  location: string;
  device: 'desktop' | 'mobile' | 'tablet';
  duration: number;
  referrer: string;
}

const mockVisitors: LiveVisitor[] = [
  { id: '1', page: '/benefits', location: 'Miami, FL', device: 'desktop', duration: 45, referrer: 'Google' },
  { id: '2', page: '/pricing', location: 'Orlando, FL', device: 'mobile', duration: 23, referrer: 'Direct' },
  { id: '3', page: '/contact', location: 'Tampa, FL', device: 'desktop', duration: 12, referrer: 'Facebook' },
  { id: '4', page: '/member-portal', location: 'Jacksonville, FL', device: 'tablet', duration: 67, referrer: 'Google' },
  { id: '5', page: '/about', location: 'Fort Lauderdale, FL', device: 'mobile', duration: 8, referrer: 'LinkedIn' },
];

export function AdminLiveView() {
  const [visitors, _setVisitors] = useState<LiveVisitor[]>(mockVisitors);
  const [activeVisitors, setActiveVisitors] = useState(47);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVisitors(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return Smartphone;
      case 'tablet': return Monitor;
      default: return Monitor;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live View</h1>
          <p className="text-slate-500 mt-1">Real-time website activity</p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Now</p>
              <p className="text-2xl font-bold text-slate-900">{activeVisitors}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-600">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live updating
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Page Views (Today)</p>
              <p className="text-2xl font-bold text-slate-900">2,847</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg. Session</p>
              <p className="text-2xl font-bold text-slate-900">3:24</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Bounce Rate</p>
              <p className="text-2xl font-bold text-slate-900">32%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Visitors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Active Visitors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Page</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visitors.map((visitor) => {
                const DeviceIcon = getDeviceIcon(visitor.device);
                return (
                  <tr key={visitor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{visitor.page}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{visitor.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DeviceIcon className="w-5 h-5 text-slate-400" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{visitor.duration}s</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                        {visitor.referrer}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminLiveView;
