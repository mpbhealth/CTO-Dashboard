import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  Upload,
  Building2
} from 'lucide-react';
import KPICard from '../ui/KPICard';
import ExportDropdown from '../ui/ExportDropdown';
import CsvUploader from '../ui/CsvUploader';
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { useEnrollmentData } from '../../hooks/useEnrollmentData';
import { useMemberStatusData } from '../../hooks/useMemberStatusData';

interface KpiMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

interface RegionalPerformance {
  region: string;
  users: number;
  revenue: number;
  growth: number;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [showImporter, setShowImporter] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<'mpb' | 'saudemax'>('mpb');
  const { refetch: refetchEnrollments } = useEnrollmentData();
  const { refetch: refetchStatus } = useMemberStatusData();

  // Empty state - no demo data, ready for file uploads
  const currentDepartmentData = {
    kpiMetrics: [] as KpiMetric[],
    dailyActiveUsers: [] as Array<{ date: string; users: number; mobile: number; desktop: number }>,
    revenueData: [] as Array<{ month: string; revenue: number; newMembers: number; growth: number }>,
    satisfactionScores: [] as Array<{ month: string; score: number; responses: number }>,
    regionalPerformance: [] as RegionalPerformance[],
    insights: [] as string[],
    recommendations: [] as string[],
    currency: selectedDepartment === 'mpb' ? '$' : 'R$',
    region: selectedDepartment === 'mpb' ? 'North America' : 'Brazil'
  };

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
  ];

  const toggleImporter = () => {
    setShowImporter(!showImporter);
  };

  const handleImportSuccess = () => {
    // Refresh enrollment and status data after successful import
    refetchEnrollments();
    refetchStatus();
  };

  // Export data for the current department
  const exportData = {
    title: `${selectedDepartment === 'mpb' ? 'MPB Health' : 'SaudeMAX'} Analytics Dashboard Report`,
    data: [
      // KPI Data
      ...currentDepartmentData.kpiMetrics.map(kpi => ({
        Department: selectedDepartment === 'mpb' ? 'MPB Health' : 'SaudeMAX',
        Category: 'Key Metrics',
        Metric: kpi.title, 
        Value: kpi.value,
        Change: kpi.change
      })),

      // Daily Active Users
      ...currentDepartmentData.dailyActiveUsers.map(day => ({
        Department: selectedDepartment === 'mpb' ? 'MPB Health' : 'SaudeMAX',
        Category: 'User Engagement',
        Date: new Date(day.date).toLocaleDateString(),
        'Total Users': day.users,
        'Mobile Users': day.mobile,
        'Desktop Users': day.desktop
      })),

      // Revenue 
      ...(currentDepartmentData.revenueData || []).map(item => ({
        Department: selectedDepartment === 'mpb' ? 'MPB Health' : 'SaudeMAX',
        Category: 'Revenue',
        Month: item.month,
        Revenue: selectedDepartment === 'mpb' ? `$${item.revenue.toLocaleString()}` : `R$${item.revenue.toLocaleString()}`,
        'New Members': item.newMembers,
        'Growth Rate': `${item.growth}%`
      })),

      // Satisfaction
      ...(currentDepartmentData.satisfactionScores || []).map(item => ({
        Department: selectedDepartment === 'mpb' ? 'MPB Health' : 'SaudeMAX',
        Category: 'Customer Satisfaction',
        Month: item.month,
        Score: item.score,
        Responses: item.responses
      })),

      // Regional Performance
      ...(currentDepartmentData.regionalPerformance || []).map(region => ({
        Department: selectedDepartment === 'mpb' ? 'MPB Health' : 'SaudeMAX',
        Category: 'Regional Performance',
        Region: region.region,
        Users: region.users,
        Revenue: selectedDepartment === 'mpb' ? `$${region.revenue.toLocaleString()}` : `R$${region.revenue.toLocaleString()}`,
        'Growth (%)': region.growth
      }))
    ],
    headers: ['Department', 'Category', 'Metric', 'Value', 'Change'],
    filename: `${selectedDepartment === 'mpb' ? 'MPB_Health' : 'SaudeMAX'}_Analytics_Report`
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {selectedDepartment === 'mpb' ? 'MPB Health' : 'SaudeMAX'} Analytics Dashboard
          </h1>
          <p className="text-slate-600 mt-2">Comprehensive business intelligence and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Department Selector */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value as 'mpb' | 'saudemax')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            aria-label="Select department"
          >
            <option value="mpb">MPB Health</option>
            <option value="saudemax">SaudeMAX (Brazil)</option>
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            aria-label="Select time range"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          
          <button 
            onClick={toggleImporter}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>{showImporter ? 'Hide Importer' : 'Import Data'}</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <ExportDropdown data={exportData} />
        </div>
      </div>
      
      {/* Import Section */}
      {showImporter && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CsvUploader
            onSuccess={handleImportSuccess}
            title={`Import ${selectedDepartment.toUpperCase()} Customer Data`}
            description="Upload customer enrollment and product data to track business performance"
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
        {currentDepartmentData.kpiMetrics.length > 0 ? (
          currentDepartmentData.kpiMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <KPICard data={metric} />
            </motion.div>
          ))
        ) : (
          <div className="col-span-full bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
            <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Analytics Data Available</h3>
            <p className="text-slate-500 mb-4">Upload your customer data to see KPI metrics, user engagement, and performance insights.</p>
            <button
              onClick={toggleImporter}
              className="inline-flex items-center space-x-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Customer Data</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Main Charts Section */}
      {currentDepartmentData.dailyActiveUsers.length > 0 || currentDepartmentData.revenueData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Active Users Chart */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Daily Active Users</h2>
              <p className="text-sm text-slate-600">User activity over time</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={currentDepartmentData.dailyActiveUsers} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#64748B" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis stroke="#64748B" />
              <Tooltip 
                formatter={(value, name) => [value, name === 'users' ? 'Total Users' : name === 'mobile' ? 'Mobile Users' : 'Desktop Users']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fill="url(#userGradient)" 
                name="Total Users"
              />
              <Area 
                type="monotone" 
                dataKey="mobile" 
                stroke="#10B981" 
                strokeWidth={1}
                fill="#10B98133" 
                name="Mobile Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Trend Chart */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue Trend</h2>
              <p className="text-sm text-slate-600">Monthly revenue and growth</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentDepartmentData.revenueData || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis 
                stroke="#64748B"
                tickFormatter={(value) => selectedDepartment === 'mpb' ? `$${value/1000}K` : `R$${value/1000}K`}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' 
                    ? (selectedDepartment === 'mpb' ? `$${value.toLocaleString()}` : `R$${value.toLocaleString()}`) 
                    : value,
                  name === 'revenue' ? 'Revenue' : name === 'newMembers' ? 'New Members' : 'Growth'
                ]}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
              <Bar dataKey="newMembers" fill="#3B82F6" name="New Members" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      
        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Satisfaction Score Trend */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Satisfaction Trend</h2>
              <p className="text-sm text-slate-600">Customer satisfaction scores</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={currentDepartmentData.satisfactionScores || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis domain={[3.5, 5]} stroke="#64748B" />
              <Tooltip 
                formatter={(value) => [`${value}`, 'Score']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#F59E0B" 
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                name="Satisfaction Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Regional Performance */}
        <motion.div 
          className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Regional Performance</h2>
              <p className="text-sm text-slate-600">User distribution and revenue by region</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700">Region</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-700">Users</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-700">Revenue</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-700">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(currentDepartmentData.regionalPerformance || []).map((region) => (
                  <tr key={region.region} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{region.region}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-slate-700">{region.users.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-slate-700">
                        {selectedDepartment === 'mpb' 
                          ? `$${region.revenue.toLocaleString()}` 
                          : `R$${region.revenue.toLocaleString()}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        region.growth >= 15 ? 'bg-emerald-100 text-emerald-800' :
                        region.growth >= 10 ? 'bg-blue-100 text-blue-800' :
                        region.growth >= 5 ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {region.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        </div>
        </div>
      ) : null}

      {/* Insights and Recommendations */}
      {(currentDepartmentData.insights && currentDepartmentData.insights.length > 0) || 
       (currentDepartmentData.recommendations && currentDepartmentData.recommendations.length > 0) ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Insights */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Key Insights</h2>
              <p className="text-sm text-slate-600">Analysis of current trends</p>
            </div>
          </div>
          
          <ul className="space-y-3">
            {(currentDepartmentData.insights || []).map((insight, index) => (
              <li 
                key={index} 
                className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
              >
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                </div>
                <p className="text-sm text-blue-800 flex-1">{insight}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Recommendations */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recommendations</h2>
              <p className="text-sm text-slate-600">Suggested actions based on data</p>
            </div>
          </div>
          
          <ul className="space-y-3">
            {(currentDepartmentData.recommendations || []).map((recommendation, index) => (
              <li 
                key={index} 
                className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg"
              >
                <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-sm font-bold text-emerald-700">{index + 1}</span>
                </div>
                <p className="text-sm text-emerald-800 flex-1">{recommendation}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
      ) : null}
    </div>
  );
}
