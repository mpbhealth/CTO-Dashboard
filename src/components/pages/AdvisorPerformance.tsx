import React, { useState } from 'react';
import { motion } from 'framer-motion';
import KPICard from '../ui/KPICard';
import ExportDropdown from '../ui/ExportDropdown';
import {
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  advisorKpis,
  topAdvisors,
  advisorSkills,
  salesTrends,
  performanceMetrics,
  planBreakdown
} from '../../data/mockAdvisorPerformance';

export default function AdvisorPerformance() {
  const [selectedAdvisor, setSelectedAdvisor] = useState('Wendy A.');
  const [timeRange, setTimeRange] = useState('30d');

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
  ];

  // Prepare comprehensive export data
  const exportData = {
    title: 'MPB Health Advisor Sales Performance Report',
    data: [
      // KPI Data
      ...advisorKpis.map(kpi => ({
        Category: 'KPI',
        Metric: kpi.title,
        Value: kpi.value,
        Change: kpi.change,
        Trend: kpi.trend,
        Period: timeRange
      })),
      // Top Advisors Performance
      ...topAdvisors.map(advisor => ({
        Category: 'Advisor Performance',
        Advisor: advisor.name,
        'Total Sales': `$${advisor.sales.toLocaleString()}`,
        'Deals Closed': advisor.deals,
        'Conversion Rate': `${advisor.conversion}%`,
        'Commission Earned': `$${advisor.commission.toLocaleString()}`,
        'Performance Rank': topAdvisors.indexOf(advisor) + 1
      })),
      // Sales Trends
      ...salesTrends.map(trend => ({
        Category: 'Sales Trends',
        Month: trend.month,
        'Monthly Sales': `$${trend.sales.toLocaleString()}`,
        'Deals Closed': trend.deals,
        'Active Advisors': trend.advisors
      })),
      // Plan Breakdown
      ...planBreakdown.map(plan => ({
        Category: 'Plan Sales',
        'Plan Type': plan.plan,
        'Sales Amount': `$${plan.sales.toLocaleString()}`,
        'Percentage': `${plan.percentage}%`,
        'Market Share': plan.percentage
      })),
      // Detailed Performance Metrics
      ...performanceMetrics.map(metric => {
        const advisor = topAdvisors.find(a => a.name === metric.advisor);
        return {
          Category: 'Detailed Metrics',
          Advisor: metric.advisor,
          'Calls Made': metric.calls,
          'Meetings Set': metric.meetings,
          'Proposals Sent': metric.proposals,
          'Deals Closed': advisor?.deals || 0,
          'Total Sales': advisor ? `$${advisor.sales.toLocaleString()}` : '$0',
          'Conversion Rate': advisor ? `${advisor.conversion}%` : '0%',
          'Commission': advisor ? `$${advisor.commission.toLocaleString()}` : '$0'
        };
      }),
      // Skill Assessment Data
      ...advisorSkills.map(skill => ({
        Category: 'Skill Assessment',
        'Skill Area': skill.skill,
        'Score': `${skill.score}/100`,
        'Performance Level': skill.score >= 90 ? 'Excellent' : skill.score >= 80 ? 'Good' : skill.score >= 70 ? 'Average' : 'Needs Improvement',
        'Assessed Advisor': selectedAdvisor
      }))
    ],
    headers: ['Category', 'Metric', 'Value', 'Performance', 'Period'],
    filename: 'MPB_Health_Advisor_Performance_Report'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Advisor Sales Performance</h1>
          <p className="text-slate-600 mt-2">Track advisor productivity, sales metrics, and skill development</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <ExportDropdown data={exportData} />
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {advisorKpis.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <KPICard data={metric} />
          </motion.div>
        ))}
      </motion.div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Advisors Sales Chart */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Top Advisors by Sales</h2>
                <p className="text-sm text-slate-600">Monthly sales performance ranking</p>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topAdvisors} layout="horizontal">
              <XAxis type="number" stroke="#64748B" tickFormatter={(value) => `$${value / 1000}K`} />
              <YAxis dataKey="name" type="category" stroke="#64748B" width={80} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'sales' ? `$${value.toLocaleString()}` : value,
                  name === 'sales' ? 'Total Sales' : name
                ]}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="sales" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Advisor Skill Radar Chart */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Skill Assessment</h2>
                <p className="text-sm text-slate-600">Top advisor skill breakdown</p>
              </div>
            </div>
            <select
              value={selectedAdvisor}
              onChange={(e) => setSelectedAdvisor(e.target.value)}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {topAdvisors.map(advisor => (
                <option key={advisor.name} value={advisor.name}>{advisor.name}</option>
              ))}
            </select>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={advisorSkills}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: '#64748B' }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickCount={6}
              />
              <Radar 
                name={selectedAdvisor} 
                dataKey="score" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Tooltip 
                formatter={(value) => [`${value}/100`, 'Score']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Secondary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trends */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Sales Trends</h2>
              <p className="text-sm text-slate-600">5-month performance</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesTrends}>
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" tickFormatter={(value) => `$${value / 1000}K`} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'sales' ? `$${value.toLocaleString()}` : value,
                  name === 'sales' ? 'Total Sales' : 'Deals Closed'
                ]}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Plan Breakdown */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Plan Sales</h2>
              <p className="text-sm text-slate-600">Revenue by plan type</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={planBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="sales"
              >
                {planBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2">
            {planBreakdown.map((plan) => (
              <div key={plan.plan} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: plan.color }}
                  ></div>
                  <span className="text-sm text-slate-700">{plan.plan}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-slate-900">{plan.percentage}%</span>
                  <p className="text-xs text-slate-600">${plan.sales.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Performance Funnel */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Sales Funnel</h2>
              <p className="text-sm text-slate-600">Top advisor activity</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { stage: 'Calls Made', value: 174, icon: Phone, color: 'bg-blue-500' },
              { stage: 'Meetings Set', value: 68, icon: Calendar, color: 'bg-indigo-500' },
              { stage: 'Proposals Sent', value: 45, icon: FileText, color: 'bg-purple-500' },
              { stage: 'Deals Closed', value: 42, icon: CheckCircle, color: 'bg-emerald-500' },
            ].map((stage, index) => {
              const Icon = stage.icon;
              const percentage = index === 0 ? 100 : Math.round((stage.value / 174) * 100);
              
              return (
                <div key={stage.stage} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${stage.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{stage.stage}</span>
                      <span className="text-sm text-slate-600">{stage.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <motion.div 
                        className={`h-2 rounded-full ${stage.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      ></motion.div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{percentage}% conversion</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Detailed Performance Table */}
      <motion.div 
        className="bg-white rounded-xl shadow-sm border border-slate-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Detailed Performance Metrics</h2>
          <p className="text-slate-600 mt-1">Comprehensive advisor activity and conversion tracking</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Advisor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Sales</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Calls</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Meetings</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Proposals</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Closed</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Conversion</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {topAdvisors.map((advisor, index) => {
                const metrics = performanceMetrics.find(m => m.advisor === advisor.name);
                return (
                  <tr key={advisor.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {advisor.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900">{advisor.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      ${advisor.sales.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{metrics?.calls || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{metrics?.meetings || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{metrics?.proposals || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{advisor.deals}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        advisor.conversion >= 20 ? 'bg-emerald-100 text-emerald-800' :
                        advisor.conversion >= 15 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {advisor.conversion}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      ${advisor.commission.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}