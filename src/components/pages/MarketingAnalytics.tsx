import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock,
  Users, 
  Globe, 
  Filter,
  RefreshCw, 
  Download, 
  Search, 
  Zap, 
  LineChart,
  PieChart, 
  Target,
  ArrowUpRight,
  Calendar,
  MousePointer,
  ShoppingCart,
  FileText,
  Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import KPICard from '../ui/KPICard';
import ExportDropdown from '../ui/ExportDropdown';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function MarketingAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [gaConnected, setGaConnected] = useState(false);
  const [fbConnected, setFbConnected] = useState(false);

  // Mock data for marketing analytics
  const marketingKPIs = [
    { title: 'Website Visitors', value: '45,782', change: '+12.3%', trend: 'up' },
    { title: 'Avg. Session Duration', value: '3m 24s', change: '+8.7%', trend: 'up' },
    { title: 'Conversion Rate', value: '3.2%', change: '+0.8%', trend: 'up' },
    { title: 'Bounce Rate', value: '39.4%', change: '-2.1%', trend: 'down' },
  ];

  const websiteTrafficData = [
    { date: '01/07', users: 1420, pageviews: 4240, sessions: 1820 },
    { date: '02/07', users: 1530, pageviews: 4450, sessions: 1950 },
    { date: '03/07', users: 1620, pageviews: 4980, sessions: 2140 },
    { date: '04/07', users: 1780, pageviews: 5120, sessions: 2280 },
    { date: '05/07', users: 1640, pageviews: 4820, sessions: 2060 },
    { date: '06/07', users: 1340, pageviews: 4120, sessions: 1780 },
    { date: '07/07', users: 1280, pageviews: 3980, sessions: 1680 },
    { date: '08/07', users: 1420, pageviews: 4240, sessions: 1820 },
    { date: '09/07', users: 1580, pageviews: 4680, sessions: 2080 },
    { date: '10/07', users: 1720, pageviews: 5040, sessions: 2180 },
    { date: '11/07', users: 1880, pageviews: 5320, sessions: 2240 },
    { date: '12/07', users: 1920, pageviews: 5480, sessions: 2380 },
    { date: '13/07', users: 1840, pageviews: 5280, sessions: 2280 },
    { date: '14/07', users: 1780, pageviews: 5120, sessions: 2180 },
  ];

  const trafficSourcesData = [
    { source: 'Direct', sessions: 9840, percentage: 34, color: '#3B82F6' },
    { source: 'Organic Search', sessions: 7680, percentage: 27, color: '#10B981' },
    { source: 'Referral', sessions: 5120, percentage: 18, color: '#F59E0B' },
    { source: 'Social', sessions: 3840, percentage: 13, color: '#8B5CF6' },
    { source: 'Email', sessions: 1440, percentage: 5, color: '#EC4899' },
    { source: 'Other', sessions: 960, percentage: 3, color: '#6B7280' },
  ];

  const campaignPerformanceData = [
    { campaign: 'Summer Promotion', visitors: 12400, conversions: 620, revenue: 31000, roi: 520 },
    { campaign: 'Email Newsletter', visitors: 8700, conversions: 348, revenue: 17400, roi: 340 },
    { campaign: 'Social Media Ads', visitors: 15800, conversions: 474, revenue: 23700, roi: 280 },
    { campaign: 'Search Ads', visitors: 9200, conversions: 552, revenue: 27600, roi: 420 },
    { campaign: 'Referral Program', visitors: 4300, conversions: 258, revenue: 12900, roi: 390 },
  ];

  const conversionFunnelData = [
    { stage: 'Website Visits', value: 45782, color: '#3B82F6' },
    { stage: 'Product Views', value: 22891, color: '#818CF8' },
    { stage: 'Add to Cart', value: 7327, color: '#A78BFA' },
    { stage: 'Checkout Started', value: 3206, color: '#C084FC' },
    { stage: 'Purchases', value: 1465, color: '#E879F9' },
  ];

  const topPagesData = [
    { url: '/home', pageviews: 12840, avgTime: '2m 12s', bounceRate: '32%' },
    { url: '/products', pageviews: 8720, avgTime: '3m 45s', bounceRate: '28%' },
    { url: '/pricing', pageviews: 6540, avgTime: '2m 38s', bounceRate: '25%' },
    { url: '/about', pageviews: 4320, avgTime: '1m 55s', bounceRate: '42%' },
    { url: '/blog', pageviews: 3780, avgTime: '4m 12s', bounceRate: '36%' },
  ];

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'traffic', label: 'Traffic Sources', icon: Globe },
    { id: 'behavior', label: 'User Behavior', icon: MousePointer },
    { id: 'conversions', label: 'Conversions', icon: Target },
    { id: 'campaigns', label: 'Campaigns', icon: Zap },
    { id: 'settings', label: 'Settings & Integrations', icon: Settings },
  ];

  // Function to connect Google Analytics
  const connectGoogleAnalytics = async () => {
    // In a real implementation, this would trigger OAuth flow
    try {
      // First check if a marketing integration record exists
      const { data: existing, error: fetchError } = await supabase
        .from('marketing_integrations')
        .select();

      if (fetchError) throw fetchError;

      if (existing && existing.length > 0) {
        // Update existing record
        const { data: marketing, error } = await supabase
          .from('marketing_integrations')
          .update({
            google_analytics_key: 'GA-MOCK-KEY',
            google_analytics_view_id: 'GA-MOCK-VIEW-ID',
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id)
          .select();

        if (error) throw error;
      } else {
        // Create new record
        const { data: marketing, error } = await supabase
          .from('marketing_integrations')
          .insert([{
            google_analytics_key: 'GA-MOCK-KEY',
            google_analytics_view_id: 'GA-MOCK-VIEW-ID',
            is_active: true
          }])
          .select();

        if (error) throw error;
      }

      setGaConnected(true);
    } catch (error) {
      console.error('Error connecting to Google Analytics:', error);
      // In real app, handle error better
    }
  };

  // Function to connect Facebook
  const connectFacebook = async () => {
    // In a real implementation, this would trigger OAuth flow
    try {
      // First check if a marketing integration record exists
      const { data: existing, error: fetchError } = await supabase
        .from('marketing_integrations')
        .select();

      if (fetchError) throw fetchError;

      if (existing && existing.length > 0) {
        // Update existing record
        const { data: marketing, error } = await supabase
          .from('marketing_integrations')
          .update({
            facebook_pixel_id: 'FB-MOCK-PIXEL-ID',
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id)
          .select();

        if (error) throw error;
      } else {
        // Create new record
        const { data: marketing, error } = await supabase
          .from('marketing_integrations')
          .insert([{
            facebook_pixel_id: 'FB-MOCK-PIXEL-ID',
            is_active: true
          }])
          .select();

        if (error) throw error;
      }

      setFbConnected(true);
    } catch (error) {
      console.error('Error connecting to Facebook:', error);
      // In real app, handle error better
    }
  };

  // Prepare export data
  const exportData = {
    title: 'MPB Health Marketing Analytics Report',
    data: [
      // KPI Data
      ...marketingKPIs.map(kpi => ({
        Category: 'KPI',
        Metric: kpi.title,
        Value: kpi.value,
        Change: kpi.change,
        Trend: kpi.trend
      })),
      // Traffic Sources
      ...trafficSourcesData.map(source => ({
        Category: 'Traffic Sources',
        Source: source.source,
        Sessions: source.sessions,
        Percentage: `${source.percentage}%`
      })),
      // Campaign Performance
      ...campaignPerformanceData.map(campaign => ({
        Category: 'Campaign',
        Campaign: campaign.campaign,
        Visitors: campaign.visitors,
        Conversions: campaign.conversions,
        Revenue: `$${campaign.revenue}`,
        ROI: `${campaign.roi}%`
      })),
      // Top Pages
      ...topPagesData.map(page => ({
        Category: 'Top Pages',
        URL: page.url,
        PageViews: page.pageviews,
        'Avg. Time': page.avgTime,
        'Bounce Rate': page.bounceRate
      }))
    ],
    headers: ['Category', 'Metric', 'Value', 'Change', 'Trend'],
    filename: 'MPB_Health_Marketing_Analytics_Report'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Marketing Analytics</h1>
          <p className="text-slate-600 mt-2">Track website performance, conversions, and marketing campaign effectiveness</p>
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
          
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            onClick={() => setIsConfiguring(!isConfiguring)}
          >
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <ExportDropdown data={exportData} />
        </div>
      </div>

      {/* Integration Notice */}
      {isConfiguring && (
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Marketing Analytics Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Google Analytics 4</h3>
                    <p className="text-sm text-slate-600">Connect your GA4 account</p>
                  </div>
                </div>
                <div>
                  {gaConnected ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Connected
                    </span>
                  ) : (
                    <button 
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                      onClick={connectGoogleAnalytics}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm text-slate-600">
                Integration with Google Analytics 4 enables real-time website analytics, user behavior tracking, and goal completion metrics.
              </div>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Facebook Pixel</h3>
                    <p className="text-sm text-slate-600">Setup conversion tracking</p>
                  </div>
                </div>
                <div>
                  {fbConnected ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Connected
                    </span>
                  ) : (
                    <button 
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                      onClick={connectFacebook}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm text-slate-600">
                Facebook Pixel integration allows you to track conversions, optimize ads, and build targeted audiences for your campaigns.
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-2">Additional Integrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border border-slate-200 rounded-lg bg-white">
                <div className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-900">Google Tag Manager</span>
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-white">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-slate-900">HotJar</span>
                </div>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg bg-white">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-slate-900">Google Ads</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {marketingKPIs.map((metric, index) => (
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Website Traffic Chart */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Website Traffic</h2>
                  <p className="text-sm text-slate-600">Sessions, users, and page views</p>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={websiteTrafficData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
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
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3B82F6" 
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#10B981" 
                  fillOpacity={1}
                  fill="url(#colorSessions)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Traffic Sources & Top Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Traffic Sources */}
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Traffic Sources</h2>
                  <p className="text-sm text-slate-600">Where your visitors come from</p>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPieChart>
                  <Pie
                    data={trafficSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="sessions"
                  >
                    {trafficSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()} sessions`, 'Traffic']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              <div className="mt-2 space-y-2">
                {trafficSourcesData.map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: source.color }}
                      ></div>
                      <span className="text-sm text-slate-700">{source.source}</span>
                    </div>
                    <div className="flex space-x-4">
                      <span className="text-sm font-medium text-slate-900">{source.percentage}%</span>
                      <span className="text-sm text-slate-600">{source.sessions.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Pages */}
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Top Pages</h2>
                  <p className="text-sm text-slate-600">Most visited pages on your site</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {topPagesData.map((page, index) => (
                  <div key={index} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-slate-900">{page.url}</h4>
                      <span className="text-sm font-medium text-blue-600">{page.pageviews.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{page.avgTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Bounce: {page.bounceRate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Campaign Performance Table */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm border border-slate-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Campaign Performance</h2>
                  <p className="text-sm text-slate-600">Track ROI and effectiveness of marketing campaigns</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Campaign</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Visitors</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Conversions</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Revenue</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {campaignPerformanceData.map((campaign, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-medium text-slate-900">{campaign.campaign}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{campaign.visitors.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{campaign.conversions.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-medium text-emerald-600">${campaign.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {campaign.roi}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'traffic' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Traffic Source Analysis</h2>
            
            {/* Traffic Source Detailed Analysis would go here */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Channel Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trafficSourcesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="source" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Traffic Quality Metrics</h3>
                <div className="space-y-4">
                  {trafficSourcesData.map(source => (
                    <div key={source.source} className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                          <span className="font-medium text-slate-900">{source.source}</span>
                        </div>
                        <span className="text-sm font-medium">{source.percentage}% of traffic</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-slate-500">Bounce Rate</p>
                          <p className="font-medium text-slate-900">{Math.round(30 + Math.random() * 40)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Avg. Session</p>
                          <p className="font-medium text-slate-900">{Math.round(1 + Math.random() * 4)}m {Math.round(Math.random() * 59)}s</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Pages/Session</p>
                          <p className="font-medium text-slate-900">{(1 + Math.random() * 5).toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">User Behavior Analysis</h2>
            
            {/* User Behavior Detailed Analysis would go here */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">Pages / Session</h3>
                  <div className="flex items-end space-x-2">
                    <span className="text-3xl font-bold text-slate-900">3.2</span>
                    <span className="text-sm text-emerald-600 mb-1">+8% vs prev period</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">Avg. Session Duration</h3>
                  <div className="flex items-end space-x-2">
                    <span className="text-3xl font-bold text-slate-900">3:24</span>
                    <span className="text-sm text-emerald-600 mb-1">+12% vs prev period</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">Bounce Rate</h3>
                  <div className="flex items-end space-x-2">
                    <span className="text-3xl font-bold text-slate-900">39.4%</span>
                    <span className="text-sm text-emerald-600 mb-1">-2.1% vs prev period</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">Top Pages by Engagement</h3>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                      <th className="pb-2">Page</th>
                      <th className="pb-2">Pageviews</th>
                      <th className="pb-2">Avg. Time</th>
                      <th className="pb-2">Bounce Rate</th>
                      <th className="pb-2">Exit Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topPagesData.map((page, index) => (
                      <tr key={index} className="text-sm">
                        <td className="py-3 text-slate-900 font-medium">{page.url}</td>
                        <td className="py-3 text-slate-700">{page.pageviews.toLocaleString()}</td>
                        <td className="py-3 text-slate-700">{page.avgTime}</td>
                        <td className="py-3 text-slate-700">{page.bounceRate}</td>
                        <td className="py-3 text-slate-700">{Math.round(30 + Math.random() * 30)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">User Flow Visualization</h3>
                <p className="text-slate-700 text-sm mb-2">Top user paths through your website</p>
                <div className="flex items-center justify-center">
                  <div className="flex items-center">
                    <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
                      Homepage
                    </div>
                    <div className="w-8 h-1 bg-slate-300"></div>
                    <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
                      Products
                    </div>
                    <div className="w-8 h-1 bg-slate-300"></div>
                    <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
                      Product Details
                    </div>
                    <div className="w-8 h-1 bg-slate-300"></div>
                    <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                      Checkout (24%)
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center text-xs text-slate-500">
                  This is a simplified representation. Connect to Google Analytics for full flow visualization.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'conversions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Conversion Tracking</h2>
                  <p className="text-sm text-slate-600">Monitor and optimize your conversion funnel</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Conversion Funnel</h3>
                <div className="space-y-4">
                  {conversionFunnelData.map((stage, index) => {
                    const nextStage = conversionFunnelData[index + 1];
                    const conversionRate = nextStage 
                      ? Math.round((nextStage.value / stage.value) * 100) 
                      : null;
                    
                    return (
                      <div key={stage.stage}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: stage.color }}
                            ></div>
                            <span className="text-sm font-medium text-slate-700">{stage.stage}</span>
                          </div>
                          <span className="text-sm font-medium text-slate-900">{stage.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-8 bg-slate-100 rounded-md overflow-hidden mb-2">
                          <div 
                            className="h-full"
                            style={{ 
                              width: `${(stage.value / conversionFunnelData[0].value) * 100}%`,
                              backgroundColor: stage.color
                            }}
                          ></div>
                        </div>
                        {conversionRate !== null && (
                          <div className="flex justify-between items-center text-xs mb-4">
                            <span className="text-slate-500">Conversion to next stage</span>
                            <span className={`font-medium ${
                              conversionRate > 40 ? 'text-emerald-600' : 
                              conversionRate > 20 ? 'text-amber-600' : 'text-red-600'
                            }`}>{conversionRate}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Conversion by Channel</h3>
                <div className="bg-slate-50 p-4 rounded-lg h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trafficSourcesData.map(source => ({
                      ...source,
                      conversionRate: Math.round(2 + Math.random() * 5)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="source" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Conversion Rate']}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="conversionRate" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-700">Overall Conversion Rate</span>
                    <span className="text-sm font-medium text-slate-900">3.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-700">Best Performing Channel</span>
                    <span className="text-sm font-medium text-slate-900">Referral (4.8%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-700">Total Conversions</span>
                    <span className="text-sm font-medium text-slate-900">1,465</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Marketing Campaign Performance</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-slate-900">Active Campaigns</h3>
                  <p className="text-sm text-slate-600">Showing performance data for {campaignPerformanceData.length} campaigns</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors">
                    Filter
                  </button>
                  <button className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">
                    New Campaign
                  </button>
                </div>
              </div>
              
              {campaignPerformanceData.map((campaign, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-slate-900">{campaign.campaign}</h4>
                      <p className="text-sm text-slate-500">Started {Math.floor(Math.random() * 30) + 1} days ago</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-md">
                      <p className="text-xs text-slate-500 mb-1">Visitors</p>
                      <p className="font-medium text-slate-900">{campaign.visitors.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md">
                      <p className="text-xs text-slate-500 mb-1">Conversions</p>
                      <p className="font-medium text-slate-900">{campaign.conversions.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md">
                      <p className="text-xs text-slate-500 mb-1">Revenue</p>
                      <p className="font-medium text-emerald-600">${campaign.revenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md">
                      <p className="text-xs text-slate-500 mb-1">ROI</p>
                      <p className="font-medium text-emerald-600">{campaign.roi}%</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Analytics Settings & Integrations</h2>
            
            <div className="space-y-8">
              {/* Google Analytics Connection */}
              <div>
                <h3 className="text-md font-medium text-slate-800 mb-4">Google Analytics Integration</h3>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">Google Analytics 4</h4>
                        <p className="text-sm text-slate-600">Connect your GA4 property</p>
                      </div>
                    </div>
                    <button 
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      onClick={connectGoogleAnalytics}
                    >
                      Configure
                    </button>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Property ID</span>
                        <span className="text-sm font-mono text-slate-900">GA-XXXXXXXXX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Measurement ID</span>
                        <span className="text-sm font-mono text-slate-900">G-XXXXXXXXXX</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Data Stream</span>
                        <span className="text-sm font-mono text-slate-900">Web</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Status</span>
                        <span className="text-sm font-medium text-emerald-600">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Conversion Tracking */}
              <div>
                <h3 className="text-md font-medium text-slate-800 mb-4">Conversion Tracking</h3>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">Goal Tracking</h4>
                          <p className="text-sm text-slate-600">Configure conversion goals</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm transition-colors">
                        Manage Goals
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-white rounded-md">
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-slate-900">Purchase Completed</span>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">Active</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-md">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-slate-900">Account Creation</span>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">Active</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-md">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-slate-900">Demo Scheduled</span>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Report Settings */}
              <div>
                <h3 className="text-md font-medium text-slate-800 mb-4">Report Settings</h3>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Scheduled Reports</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-white rounded-md">
                          <div>
                            <p className="font-medium text-slate-900">Weekly Performance</p>
                            <p className="text-xs text-slate-500">Sent every Monday at 8:00 AM</p>
                          </div>
                          <button className="text-indigo-600 hover:text-indigo-800 text-sm">Edit</button>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-md">
                          <div>
                            <p className="font-medium text-slate-900">Monthly Summary</p>
                            <p className="text-xs text-slate-500">Sent on the 1st at 8:00 AM</p>
                          </div>
                          <button className="text-indigo-600 hover:text-indigo-800 text-sm">Edit</button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Data Collection</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-white rounded-md">
                          <div>
                            <p className="font-medium text-slate-900">IP Anonymization</p>
                            <p className="text-xs text-slate-500">Compliant with privacy regulations</p>
                          </div>
                          <div className="relative inline-block w-12 h-6 rounded-full bg-emerald-500">
                            <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white"></span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-md">
                          <div>
                            <p className="font-medium text-slate-900">User Consent Banner</p>
                            <p className="text-xs text-slate-500">For GDPR compliance</p>
                          </div>
                          <div className="relative inline-block w-12 h-6 rounded-full bg-emerald-500">
                            <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}