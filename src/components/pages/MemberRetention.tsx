import React, { useState } from 'react';
import { motion } from 'framer-motion';
import KPICard from '../ui/KPICard';
import CsvUploader from '../ui/CsvUploader';
import {
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingDown, TrendingUp, Users, Calendar } from 'lucide-react';
import {
  retentionKPIs,
  retentionTimeline,
  churnTimeline,
  churnReasons,
  cohortAnalysis
} from '../../data/mockRetention';
import { useMemberStatusData, getStatusCounts } from '../../hooks/useMemberStatusData';

export default function MemberRetention() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6m');
  const [showImporter, setShowImporter] = useState(false);
  const { data: memberStatusData, loading: statusLoading, error: statusError, refetch: refetchStatus } = useMemberStatusData();

  const timeframes = [
    { value: '3m', label: 'Last 3 months' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last year' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Member Retention & Churn</h1>
          <p className="text-slate-600 mt-2">Track member lifecycle, retention patterns, and churn analysis</p>
        </div>
        
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {timeframes.map(timeframe => (
            <option key={timeframe.value} value={timeframe.value}>{timeframe.label}</option>
          ))}
        </select>
      </div>
      
      {/* CSV Import Section */}
      {showImporter && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CsvUploader
            onSuccess={refetchStatus}
            title="Import Member Status Data"
            description="Upload member status changes to track retention trends"
          />
        </motion.div>
      )}
      
      {/* CSV Import Section */}
      {showImporter && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CsvUploader
            onSuccess={refetchStatus}
            title="Import Member Status Data"
            description="Upload member status changes to track retention trends"
          />
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Import Status Data Button */}
        <button
          onClick={() => setShowImporter(!showImporter)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
        >
          <Calendar className="w-4 h-4" />
          <span>{showImporter ? 'Hide Importer' : 'Import Status Data'}</span>
        </button>
        
        {/* KPI Cards */}
        {/* Import Status Data Button */}
        <button
          onClick={() => setShowImporter(!showImporter)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
        >
          <Calendar className="w-4 h-4" />
          <span>{showImporter ? 'Hide Importer' : 'Import Status Data'}</span>
        </button>
        
        {/* KPI Cards */}
        {retentionKPIs.map((metric, index) => (
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
        {/* Retention Rate Timeline */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Retention Rate Over Time</h2>
              <p className="text-sm text-slate-600">Monthly retention percentage trends</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={retentionTimeline} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis domain={[85, 92]} stroke="#64748B" tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'retention' ? `${value}%` : value,
                  name === 'retention' ? 'Retention Rate' : name
                ]}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="retention" 
                stroke="#10B981" 
                strokeWidth={3}
                fill="url(#retentionGradient)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Churn Volume */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Churn Volume</h2>
              <p className="text-sm text-slate-600">Monthly member churn breakdown</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={churnTimeline} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="voluntary" stackId="a" fill="#EF4444" name="Voluntary Churn" />
              <Bar dataKey="involuntary" stackId="a" fill="#FCA5A5" name="Involuntary Churn" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Secondary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Churn Reasons */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Churn Reasons</h2>
              <p className="text-sm text-slate-600">Why members leave</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {churnReasons.map((reason, index) => (
              <div key={reason.reason} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{reason.reason}</span>
                    <span className="text-sm text-slate-600">{reason.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <motion.div 
                      className="bg-amber-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${reason.percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    ></motion.div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{reason.count} members</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cohort Analysis */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Cohort Retention Analysis</h2>
              <p className="text-sm text-slate-600">Member retention by signup month</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Cohort</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-700">Month 1</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-700">Month 2</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-700">Month 3</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-700">Month 4</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-700">Month 5</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-700">Month 6</th>
                </tr>
              </thead>
              <tbody>
                {cohortAnalysis.map((cohort) => (
                  <tr key={cohort.cohort} className="border-b border-slate-100">
                    <td className="py-2 px-3 font-medium text-slate-900">{cohort.cohort}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                        {cohort.month1}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {cohort.month2 && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month2 >= 90 ? 'bg-emerald-100 text-emerald-800' :
                          cohort.month2 >= 85 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month2}%
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {cohort.month3 && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month3 >= 85 ? 'bg-emerald-100 text-emerald-800' :
                          cohort.month3 >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month3}%
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {cohort.month4 && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month4 >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          cohort.month4 >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month4}%
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {cohort.month5 && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month5 >= 75 ? 'bg-emerald-100 text-emerald-800' :
                          cohort.month5 >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month5}%
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {cohort.month6 && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cohort.month6 >= 70 ? 'bg-emerald-100 text-emerald-800' :
                          cohort.month6 >= 65 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cohort.month6}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Insights Section */}
      <motion.div 
        className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Insights & Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <h3 className="font-medium text-emerald-900 mb-2">✅ Positive Trends</h3>
            <ul className="text-sm text-emerald-800 space-y-1">
              <li>• Retention rate improved 1.5% this month</li>
              <li>• Voluntary churn decreased by 6.1%</li>
              <li>• Average tenure increased to 13.2 months</li>
            </ul>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="font-medium text-amber-900 mb-2">⚠️ Areas of Concern</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• 34% of churn due to cost concerns</li>
              <li>• Service issues causing 18% of departures</li>
              <li>• Month 3-4 retention drop in newer cohorts</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">💡 Recommendations</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Implement value-focused onboarding</li>
              <li>• Address service quality issues</li>
              <li>• Create month 3 engagement campaign</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}