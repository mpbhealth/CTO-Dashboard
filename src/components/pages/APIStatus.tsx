//
import { useAPIStatuses } from '../../hooks/useSupabaseData';
import { Activity, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function APIStatus() {
  const { data: apiStatuses, loading, error } = useAPIStatuses();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading data: {error}</p>
          <p className="text-slate-600">Please make sure you're connected to Supabase.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'Down':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-100 text-emerald-800';
      case 'Warning':
        return 'bg-amber-100 text-amber-800';
      case 'Down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime === 0) return 'text-red-600';
    if (responseTime > 1000) return 'text-amber-600';
    if (responseTime > 500) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const healthyCount = apiStatuses.filter(api => api.status === 'Healthy').length;
  const warningCount = apiStatuses.filter(api => api.status === 'Warning').length;
  const downCount = apiStatuses.filter(api => api.status === 'Down').length;
  const avgResponseTime = apiStatuses.length > 0 ? 
    Math.round(apiStatuses.reduce((sum, api) => sum + api.response_time, 0) / apiStatuses.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">API Status Dashboard</h1>
        <p className="text-slate-600 mt-2">Monitor the health and performance of all MPB Health APIs</p>
      </div>

      {/* API Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Healthy APIs</p>
              <p className="text-2xl font-bold text-slate-900">{healthyCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Warning</p>
              <p className="text-2xl font-bold text-slate-900">{warningCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Down</p>
              <p className="text-2xl font-bold text-slate-900">{downCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Response</p>
              <p className="text-2xl font-bold text-slate-900">{avgResponseTime}ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {apiStatuses.map((api) => (
          <div key={api.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(api.status)}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{api.name}</h3>
                  <p className="text-slate-600 text-sm">{api.url}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(api.status)}`}>
                {api.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-slate-600 mb-1">Response Time</p>
                <p className={`text-2xl font-bold ${getResponseTimeColor(api.response_time)}`}>
                  {api.response_time === 0 ? 'N/A' : `${api.response_time}ms`}
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-slate-600 mb-1">Last Checked</p>
                <p className="text-sm text-slate-900">
                  {new Date(api.last_checked).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Status Details */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    api.status === 'Healthy' ? 'bg-emerald-500' :
                    api.status === 'Warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-slate-700">
                    {api.status === 'Healthy' ? 'All systems operational' :
                     api.status === 'Warning' ? 'Slow response times detected' :
                     'Service unavailable'}
                  </span>
                </div>
                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Incidents */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Recent Incidents</h2>
          <p className="text-slate-600 mt-1">Latest API incidents and resolutions</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              {
                time: '2 hours ago',
                api: 'MPB Health APP API',
                issue: 'High response times detected',
                status: 'Resolved',
                severity: 'warning'
              },
              {
                time: '1 day ago',
                api: 'SaudeMAX System API',
                issue: 'Service outage - database connection timeout',
                status: 'Investigating',
                severity: 'error'
              },
              {
                time: '3 days ago',
                api: 'E123 API',
                issue: 'Rate limit exceeded by client',
                status: 'Resolved',
                severity: 'info'
              }
            ].map((incident, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border border-slate-200 rounded-lg">
                <div className={`w-3 h-3 rounded-full mt-2 ${
                  incident.severity === 'error' ? 'bg-red-500' :
                  incident.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900">{incident.api}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        incident.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {incident.status}
                      </span>
                      <span className="text-sm text-slate-600">{incident.time}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{incident.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
