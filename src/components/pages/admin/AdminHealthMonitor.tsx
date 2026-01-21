import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cloud,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: string;
  lastChecked: string;
  icon: React.ElementType;
}

const services: ServiceStatus[] = [
  { name: 'Web Server', status: 'healthy', latency: 45, uptime: '99.99%', lastChecked: '30s ago', icon: Server },
  { name: 'Database', status: 'healthy', latency: 12, uptime: '99.95%', lastChecked: '30s ago', icon: Database },
  { name: 'CDN', status: 'healthy', latency: 8, uptime: '100%', lastChecked: '30s ago', icon: Cloud },
  { name: 'API Gateway', status: 'degraded', latency: 156, uptime: '99.87%', lastChecked: '30s ago', icon: Wifi },
  { name: 'Auth Service', status: 'healthy', latency: 23, uptime: '99.99%', lastChecked: '30s ago', icon: Activity },
];

export function AdminHealthMonitor() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdate(new Date());
    }, 1000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'down': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      healthy: 'bg-emerald-100 text-emerald-700',
      degraded: 'bg-amber-100 text-amber-700',
      down: 'bg-red-100 text-red-700',
    };
    return styles[status as keyof typeof styles] || styles.healthy;
  };

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const downCount = services.filter(s => s.status === 'down').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Monitor</h1>
          <p className="text-slate-500 mt-1">System status and performance monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`p-6 rounded-2xl ${
        downCount > 0 ? 'bg-red-50 border border-red-200' :
        degradedCount > 0 ? 'bg-amber-50 border border-amber-200' :
        'bg-emerald-50 border border-emerald-200'
      }`}>
        <div className="flex items-center gap-4">
          {downCount > 0 ? (
            <XCircle className="w-10 h-10 text-red-500" />
          ) : degradedCount > 0 ? (
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          ) : (
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          )}
          <div>
            <h2 className={`text-xl font-bold ${
              downCount > 0 ? 'text-red-900' :
              degradedCount > 0 ? 'text-amber-900' :
              'text-emerald-900'
            }`}>
              {downCount > 0 ? 'System Outage Detected' :
               degradedCount > 0 ? 'Some Services Degraded' :
               'All Systems Operational'}
            </h2>
            <p className={`text-sm mt-1 ${
              downCount > 0 ? 'text-red-700' :
              degradedCount > 0 ? 'text-amber-700' :
              'text-emerald-700'
            }`}>
              {healthyCount} healthy, {degradedCount} degraded, {downCount} down
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">CPU Usage</p>
              <p className="text-2xl font-bold text-slate-900">34%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Memory Usage</p>
              <p className="text-2xl font-bold text-slate-900">67%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Response</p>
              <p className="text-2xl font-bold text-slate-900">48ms</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Uptime (30d)</p>
              <p className="text-2xl font-bold text-slate-900">99.97%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Service Status</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {services.map((service) => {
            const ServiceIcon = service.icon;
            return (
              <div key={service.name} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <ServiceIcon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <p className="text-sm text-slate-500">Last checked: {service.lastChecked}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">{service.latency}ms</p>
                    <p className="text-xs text-slate-500">latency</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">{service.uptime}</p>
                    <p className="text-xs text-slate-500">uptime</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Recent Incidents</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">API Gateway Latency Spike</p>
                <p className="text-sm text-amber-700 mt-1">Elevated response times detected. Investigating root cause.</p>
                <p className="text-xs text-amber-600 mt-2">Started 15 minutes ago</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Database Maintenance Completed</p>
                <p className="text-sm text-slate-600 mt-1">Scheduled maintenance completed successfully with no downtime.</p>
                <p className="text-xs text-slate-500 mt-2">Resolved 2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHealthMonitor;
