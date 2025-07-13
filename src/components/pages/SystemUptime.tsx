import React from 'react';
import KPICard from '../ui/KPICard';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import {
  uptimeKPIs,
  uptimeTimeline,
  systemComponents
} from '../../data/mockUptime';

export default function SystemUptime() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'Down':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-slate-600" />;
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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">System Uptime Timeline</h1>
      <p className="text-slate-600 mt-2">Monitor system health, uptime metrics, and component status</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {uptimeKPIs.map((metric) => (
          <KPICard key={metric.title} data={metric} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Uptime Timeline Area Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Uptime Timeline (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={uptimeTimeline}>
              <defs>
                <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748B" />
              <YAxis domain={[99.7, 100]} stroke="#64748B" tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Uptime']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="uptime" 
                stroke="#10B981" 
                strokeWidth={3}
                fill="url(#uptimeGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Response Time by Component</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={systemComponents} layout="horizontal">
              <XAxis type="number" stroke="#64748B" tickFormatter={(value) => `${value}ms`} />
              <YAxis dataKey="name" type="category" stroke="#64748B" width={100} />
              <Tooltip 
                formatter={(value) => [`${value}ms`, 'Response Time']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="responseTime" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Components Status */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">System Components Status</h2>
        <div className="space-y-4">
          {systemComponents.map((component) => (
            <div key={component.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex items-center space-x-3">
                {getStatusIcon(component.status)}
                <div>
                  <h3 className="font-medium text-slate-900">{component.name}</h3>
                  <p className="text-sm text-slate-600">Uptime: {component.uptime}%</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{component.responseTime}ms</p>
                  <p className="text-xs text-slate-600">avg response</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(component.status)}`}>
                  {component.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}