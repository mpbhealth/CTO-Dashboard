import React from 'react';
import KPICard from '../ui/KPICard';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import {
  memberEngagementKPIs,
  dailyLoginsData,
  featureUsageData
} from '../../data/mockMemberEngagement';

export default function MemberEngagement() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Member Engagement</h1>
      <p className="text-slate-600 mt-2">Track member activity, feature usage, and engagement patterns</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {memberEngagementKPIs.map((metric) => (
          <KPICard key={metric.title} data={metric} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Daily Logins Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Logins (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyLoginsData}>
              <XAxis dataKey="date" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="logins" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Usage Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Feature Usage Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureUsageData} layout="horizontal">
              <XAxis type="number" stroke="#64748B" />
              <YAxis dataKey="feature" type="category" stroke="#64748B" width={80} />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Usage Rate']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="usage" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}