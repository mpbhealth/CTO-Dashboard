import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Award,
  Briefcase,
  Activity,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  TrendingDown,
  Calendar,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Executive color palette - Gold, Navy, Emerald
const EXECUTIVE_COLORS = {
  primary: '#D4AF37', // Gold
  secondary: '#1E3A8A', // Navy
  success: '#059669', // Emerald
  warning: '#F59E0B', // Amber
  danger: '#DC2626', // Red
  accent: '#8B5CF6', // Purple
};

const CHART_COLORS = ['#D4AF37', '#1E3A8A', '#059669', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function CEOOverview() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Mock data - will be replaced with real data from Supabase
  const executiveMetrics = {
    revenue: {
      current: 487250,
      previous: 434200,
      change: 12.3,
      trend: 'up' as const,
    },
    enrollments: {
      current: 234,
      previous: 217,
      change: 7.8,
      trend: 'up' as const,
    },
    ltv: {
      current: 12450,
      previous: 11850,
      change: 5.1,
      trend: 'up' as const,
    },
    churn: {
      current: 2.1,
      previous: 2.4,
      change: -12.5,
      trend: 'down' as const,
    },
  };

  // Revenue trend data
  const revenueTrend = useMemo(() => [
    { month: 'Apr', revenue: 385000, enrollments: 198, target: 400000 },
    { month: 'May', revenue: 412000, enrollments: 215, target: 420000 },
    { month: 'Jun', revenue: 434200, enrollments: 217, target: 440000 },
    { month: 'Jul', revenue: 487250, enrollments: 234, target: 460000 },
  ], []);

  // Sales pipeline data
  const pipelineData = [
    { name: 'Leads', value: 450, fill: CHART_COLORS[0] },
    { name: 'Prospects', value: 180, fill: CHART_COLORS[1] },
    { name: 'Quotes', value: 85, fill: CHART_COLORS[2] },
    { name: 'Closed', value: 52, fill: CHART_COLORS[3] },
  ];

  // Top performers
  const topPerformers = [
    { name: 'Sarah Johnson', revenue: 124500, enrollments: 28, satisfaction: 98 },
    { name: 'Michael Chen', revenue: 118200, enrollments: 26, satisfaction: 96 },
    { name: 'Emily Rodriguez', revenue: 112800, enrollments: 25, satisfaction: 97 },
    { name: 'David Kim', revenue: 98400, enrollments: 22, satisfaction: 95 },
    { name: 'Lisa Anderson', revenue: 94200, enrollments: 21, satisfaction: 94 },
  ];

  // Product performance
  const productMix = [
    { name: 'Medicare Advantage', value: 45, revenue: 218000 },
    { name: 'Medicare Supplement', value: 30, revenue: 146000 },
    { name: 'Part D', value: 15, revenue: 73000 },
    { name: 'Other', value: 10, revenue: 50250 },
  ];

  // Quick actions for CEO
  const quickActions = [
    { label: 'View Sales Pipeline', icon: Target, color: 'bg-pink-400', action: () => {} },
    { label: 'Agent Performance', icon: Award, color: 'bg-purple-500', action: () => {} },
    { label: 'Marketing ROI', icon: TrendingUp, color: 'bg-green-500', action: () => {} },
    { label: 'Strategic Goals', icon: Briefcase, color: 'bg-amber-500', action: () => {} },
  ];

  // Alerts and notifications
  const alerts = [
    { type: 'success', message: 'Monthly revenue target exceeded by 6%!', time: '2h ago' },
    { type: 'warning', message: '3 large deals closing this week - require attention', time: '4h ago' },
    { type: 'info', message: 'Q4 strategy meeting scheduled for Oct 25', time: '1d ago' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-8 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Good morning, CEO</h1>
              <p className="text-pink-100 text-lg">
                Here's what's happening at MPB Health today
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-pink-800 text-white px-4 py-2 rounded-lg border border-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Select time range"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={() => window.location.reload()}
                className="p-2 bg-pink-800 rounded-lg hover:bg-pink-700 transition-colors"
                aria-label="Refresh data"
              >
                <Activity className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics - Executive KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center space-x-1 ${
                executiveMetrics.revenue.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {executiveMetrics.revenue.trend === 'up' ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
                <span className="font-semibold">{formatChange(executiveMetrics.revenue.change)}</span>
              </div>
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(executiveMetrics.revenue.current)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              vs {formatCurrency(executiveMetrics.revenue.previous)} last month
            </p>
          </motion.div>

          {/* New Enrollments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center space-x-1 ${
                executiveMetrics.enrollments.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {executiveMetrics.enrollments.trend === 'up' ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
                <span className="font-semibold">{formatChange(executiveMetrics.enrollments.change)}</span>
              </div>
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">New Enrollments</h3>
            <p className="text-3xl font-bold text-slate-900">
              {executiveMetrics.enrollments.current}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              vs {executiveMetrics.enrollments.previous} last month
            </p>
          </motion.div>

          {/* Customer LTV */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center space-x-1 ${
                executiveMetrics.ltv.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {executiveMetrics.ltv.trend === 'up' ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
                <span className="font-semibold">{formatChange(executiveMetrics.ltv.change)}</span>
              </div>
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Customer LTV</h3>
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(executiveMetrics.ltv.current)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              vs {formatCurrency(executiveMetrics.ltv.previous)} last month
            </p>
          </motion.div>

          {/* Churn Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center space-x-1 ${
                executiveMetrics.churn.change < 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {executiveMetrics.churn.change < 0 ? (
                  <ArrowDownRight className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
                <span className="font-semibold">{formatChange(Math.abs(executiveMetrics.churn.change))}</span>
              </div>
            </div>
            <h3 className="text-slate-600 text-sm font-medium mb-1">Churn Rate</h3>
            <p className="text-3xl font-bold text-slate-900">
              {executiveMetrics.churn.current}%
            </p>
            <p className="text-xs text-slate-500 mt-2">
              vs {executiveMetrics.churn.previous}% last month
            </p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-all border border-slate-200 group"
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{action.label}</p>
              </button>
            );
          })}
        </motion.div>

        {/* Revenue & Enrollment Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Trend Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Revenue Trend</h3>
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-slate-600">Actual</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                  <span className="text-slate-600">Target</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Sales Pipeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Sales Pipeline</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Top Performers & Product Mix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-500" />
                Top Performers
              </h3>
              <span className="text-xs text-slate-500">This Month</span>
            </div>
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-amber-500' :
                      index === 1 ? 'bg-slate-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{performer.name}</p>
                      <p className="text-xs text-slate-500">
                        {performer.enrollments} enrollments • {performer.satisfaction}% satisfaction
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(performer.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Product Mix */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Performance</h3>
            <div className="flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height={180}>
                <RechartsPieChart>
                  <Pie
                    data={productMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {productMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {productMix.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index] }}
                    ></div>
                    <span className="text-sm text-slate-700">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900">{product.value}%</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Alerts & Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-amber-500" />
            Priority Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 p-4 rounded-lg ${
                  alert.type === 'success' ? 'bg-emerald-50 border border-emerald-200' :
                  alert.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                  'bg-pink-50 border border-pink-200'
                }`}
              >
                {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
                {alert.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                {alert.type === 'info' && <Activity className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    alert.type === 'success' ? 'text-emerald-900' :
                    alert.type === 'warning' ? 'text-amber-900' :
                    'text-pink-900'
                  }`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

