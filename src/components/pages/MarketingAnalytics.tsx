import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMarketingProperties, useMarketingMetrics, aggregateMetrics, getTrafficSourceData } from '../../hooks/useMarketingData';
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
  Plus,
  Zap, 
  LineChart,
  PieChart, 
  Target,
  ArrowUpRight,
  Calendar,
  MousePointer,
  ShoppingCart,
  FileText,
  Settings,
  Globe,
  Target,
  MousePointer,
  X,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import KPICard from '../ui/KPICard';
import ExportDropdown from '../ui/ExportDropdown';
import AddPropertyForm from '../ui/AddPropertyForm';
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
  const [sourceFilter, setSourceFilter] = useState('');
  const [conversionFilter, setConversionFilter] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [gaConnected, setGaConnected] = useState(false);
  const [fbConnected, setFbConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { metrics, loading: metricsLoading, error: metricsError, kpis, trafficSources } = useMarketingMetrics(
    selectedProperty, 
    timeRange,
    { source: sourceFilter, conversion: conversionFilter }
  );
  const [showGAForm, setShowGAForm] = useState(false);
  const [showFBForm, setShowFBForm] = useState(false);
  const [gaCredentials, setGaCredentials] = useState({
    measurementId: '',
    viewId: ''
  });
  const [fbCredentials, setFbCredentials] = useState({
    pixelId: ''
  });
  const [gaFormData, setGAFormData] = useState({
    analytics_key: '',
    view_id: '',
    property_id: ''
  });

  // Get date range for metrics
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  // Fetch data from Supabase
  const { data: properties, loading: propertiesLoading, error: propertiesError, refetch: refetchProperties, addProperty, updateProperty } = useMarketingProperties();
  const { data: metrics, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useMarketingMetrics(selectedPropertyId, getDateRange());

  // Set default selected property
  React.useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // Calculate aggregated metrics and KPIs
  const aggregated = aggregateMetrics(metrics);
  const trafficSourcesData = getTrafficSourceData(metrics);

  // Generate KPIs from real data
  const marketingKPIs = aggregated ? [
    { 
      title: 'Total Sessions', 
      value: aggregated.sessions.toLocaleString(), 
      change: '+12.3%', // Would calculate from previous period
      trend: 'up' as const
    },
    { 
      title: 'Unique Users', 
      value: aggregated.users.toLocaleString(), 
      change: '+8.7%', 
      trend: 'up' as const
    },
    { 
      title: 'Conversion Rate', 
      value: `${aggregated.conversionRate.toFixed(1)}%`, 
      change: '+0.8%', 
      trend: 'up' as const
    },
    { 
      title: 'Bounce Rate', 
      value: `${aggregated.avgBounceRate.toFixed(1)}%`, 
      change: '-2.1%', 
      trend: 'down' as const
    },
  ] : [
    { title: 'Total Sessions', value: '0', change: '+0%', trend: 'stable' as const },
    { title: 'Unique Users', value: '0', change: '+0%', trend: 'stable' as const },
    { title: 'Conversion Rate', value: '0%', change: '+0%', trend: 'stable' as const },
    { title: 'Bounce Rate', value: '0%', change: '+0%', trend: 'stable' as const },
  ];
  // Mock data for marketing analytics
  // Generate website traffic data from metrics
  const websiteTrafficData = metrics.length > 0 
    ? metrics.reduce((acc, metric) => {
        const dateKey = new Date(metric.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        const existing = acc.find(item => item.date === dateKey);
        
        if (existing) {
          existing.users += metric.users;
          existing.pageviews += metric.pageviews;
          existing.sessions += metric.sessions;
        } else {
          acc.push({
            date: dateKey,
            users: metric.users,
            pageviews: metric.pageviews,
            sessions: metric.sessions
          });
        }
        return acc;
      }, [] as any[])
    : [
        { date: '01/07', users: 1420, pageviews: 4240, sessions: 1820 },
        { date: '02/07', users: 1530, pageviews: 4450, sessions: 1950 },
        // ... mock data as fallback
      ];

  // Use real data or fallback to mock data
  const finalTrafficSourcesData = trafficSourcesData.length > 0 ? trafficSourcesData : [
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

  const trafficSources = [
    { value: '', label: 'All Sources' },
    { value: 'google', label: 'Google' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'email', label: 'Email' },
    { value: 'referral', label: 'Referral' },
    { value: 'direct', label: 'Direct' },
    { value: 'social', label: 'Social Media' },
    { value: 'paid', label: 'Paid Ads' }
  ];

  const conversionTypes = [
    { value: '', label: 'All Conversions' },
    { value: 'signup', label: 'User Signup' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'form_submission', label: 'Form Submission' },
    { value: 'newsletter', label: 'Newsletter Subscribe' },
    { value: 'download', label: 'Download' },
    { value: 'contact', label: 'Contact Form' }
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
    if (!selectedPropertyId) {
      setConnectionError('Please select a property first');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Get current user for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      
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
            ga_property_id: gaCredentials.measurementId,
            ga_measurement_id: gaCredentials.viewId,
            ga_connected: true
          })
          .eq('id', existing[0].id);

        if (error) throw error;
      }

      const result = await updateProperty(selectedPropertyId, {
        ga_property_id: gaCredentials.measurementId,
        ga_measurement_id: gaCredentials.viewId,
        ga_connected: true
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setGaConnected(true);
      setShowGAForm(false);
      setConnectionError(null);
    } catch (error) {
      console.error('Error connecting to Google Analytics:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect Google Analytics');
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to connect Facebook
  const connectFacebook = async () => {
    if (!selectedPropertyId) {
      setConnectionError('Please select a property first');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Get current user for created_by field
      const result = await updateProperty(selectedPropertyId, {
        fb_pixel_id: fbCredentials.pixelId,
        fb_connected: true
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setFbConnected(true);
      setShowFBForm(false);
      setConnectionError(null);
    } catch (error) {
      console.error('Error connecting to Facebook:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect to Facebook');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAddPropertySuccess = () => {
    refetchProperties();
    setIsAddPropertyModalOpen(false);
  };

  const clearFilters = () => {
    setSourceFilter('');
    setConversionFilter('');
  };

  const hasActiveFilters = sourceFilter || conversionFilter;
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
      ...finalTrafficSourcesData.map(source => ({
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
          {/* Property Selector */}
          {properties.length > 0 && (
            <select
              value={selectedPropertyId || ''}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Property</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          )}

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
            onClick={() => setIsAddPropertyModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
          
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
      
      {/* Export Filtered Data Section */}
      {selectedProperty && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Export Filtered Data</h3>
              <p className="text-sm text-slate-600">
                Export {filteredMetrics.length} records for {properties.find(p => p.id === selectedProperty)?.name}
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filters applied)`}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <ExportDropdown data={filteredExportData} />
            </div>
          </div>
        </div>
      )}

      {/* Property Status & Connection Info */}
      {selectedProperty && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{selectedProperty.name}</h2>
              <div className="flex items-center space-x-4">
                {selectedProperty.website_url && (
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Globe className="w-4 h-4" />
                    <a 
                      href={selectedProperty.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {selectedProperty.website_url}
                      <ExternalLink className="w-3 h-3 inline ml-1" />
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  {selectedProperty.ga_connected ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="text-sm text-slate-600">
                    GA4: {selectedProperty.ga_connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedProperty.fb_connected ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="text-sm text-slate-600">
                    Facebook: {selectedProperty.fb_connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setGaCredentials({
                    measurementId: selectedProperty.ga_property_id || '',
                    viewId: selectedProperty.ga_measurement_id || ''
                  });
                  setFbCredentials({
                    pixelId: selectedProperty.fb_pixel_id || ''
                  });
                  setGaConnected(selectedProperty.ga_connected);
                  setFbConnected(selectedProperty.fb_connected);
                  setIsConfiguring(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Configure Integrations</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Advanced Filters */}
      {selectedProperty && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Advanced Filters</h3>
              {hasActiveFilters && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                  {(sourceFilter ? 1 : 0) + (conversionFilter ? 1 : 0)} active
                </span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Traffic Source</span>
                </div>
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {trafficSources.map(source => (
                  <option key={source.value} value={source.value}>{source.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Conversion Type</span>
                </div>
              </label>
              <select
                value={conversionFilter}
                onChange={(e) => setConversionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {conversionTypes.map(conversion => (
                  <option key={conversion.value} value={conversion.value}>{conversion.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <div className="flex items-center space-x-2 mb-1">
                  <MousePointer className="w-4 h-4" />
                  <span>Active Filters:</span>
                </div>
                <p className="text-xs">
                  {!hasActiveFilters ? 'None selected' : 
                   `${sourceFilter ? sourceFilter : 'All sources'}, ${conversionFilter ? conversionFilter : 'All conversions'}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - No Properties */}
      {!propertiesLoading && properties.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
          <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Marketing Properties</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Get started by adding your first website or application property to track analytics.
          </p>
          <button
            onClick={() => setIsAddPropertyModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Property</span>
          </button>
        </div>
      )}

      {!selectedPropertyId && properties.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-amber-800">Please select a property from the dropdown above to view analytics.</p>
          </div>
        </div>
      )}

      {/* Integration Notice */}
      {isConfiguring && selectedPropertyId && (
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {connectionError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{connectionError}</p>
            </div>
          )}

          <h2 className="text-xl font-semibold text-slate-900 mb-6">Marketing Analytics Integrations</h2>
          <p className="text-slate-600 mb-6">
            Configuring integrations for: <strong>{selectedProperty?.name}</strong>
          </p>

          
          {/* Error Display */}
          {connectionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Configuration Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{connectionError}</p>
              <button 
                onClick={() => setConnectionError(null)}
                className="mt-2 text-red-600 hover:text-red-800 text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
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
                  {selectedProperty?.ga_connected ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Connected
                    </span>
                  ) : showGAForm ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="GA Measurement ID"
                        value={gaCredentials.measurementId}
                        onChange={(e) => setGaCredentials({ ...gaCredentials, measurementId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="GA View ID (optional)"
                        value={gaCredentials.viewId}
                        onChange={(e) => setGaCredentials({ ...gaCredentials, viewId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <div className="flex space-x-2">
                        <button 
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center space-x-1"
                          onClick={connectGoogleAnalytics}
                          disabled={isConnecting || !gaCredentials.measurementId}
                        >
                          {isConnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                          <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                        </button>
                        <button 
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm"
                          onClick={() => setShowGAForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                      onClick={() => setShowGAForm(true)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? 'Connecting...' : 'Configure'}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Google Analytics Configuration Form */}
              {showGAForm && !gaConnected && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-3">Configure Google Analytics</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Measurement ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="G-XXXXXXXXXX"
                        value={gaFormData.analytics_key}
                        onChange={(e) => setGAFormData({ ...gaFormData, analytics_key: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        View ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="123456789"
                        value={gaFormData.view_id}
                        onChange={(e) => setGAFormData({ ...gaFormData, view_id: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        onClick={() => {
                          setShowGAForm(false);
                          setGAFormData({ analytics_key: '', view_id: '', property_id: '' });
                        }}
                        className="px-3 py-1 text-slate-600 hover:text-slate-800 text-sm"
                        disabled={isConnecting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={connectGoogleAnalytics}
                        disabled={isConnecting}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
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
                  {selectedProperty?.fb_connected ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Connected
                    </span>
                  ) : showFBForm ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Facebook Pixel ID"
                        value={fbCredentials.pixelId}
                        onChange={(e) => setFbCredentials({ ...fbCredentials, pixelId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <div className="flex space-x-2">
                        <button 
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center space-x-1"
                          onClick={connectFacebook}
                          disabled={isConnecting || !fbCredentials.pixelId}
                        >
                          {isConnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                          <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                        </button>
                        <button 
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm"
                          onClick={() => setShowFBForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                      onClick={() => setShowFBForm(true)}
                      disabled={isConnecting}
                    >
                      Configure
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
      
      {/* Export Summary for Current View */}
      {selectedProperty && filteredMetrics.length > 0 && (
        <motion.div 
          className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">Export Current View</h3>
              <p className="text-sm text-indigo-700 mt-1">
                {filteredMetrics.length} data points • {activeFiltersCount} filters applied • {timeRange} time range
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {sourceFilter !== 'all' && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                    Source: {sourceFilter}
                  </span>
                )}
                {conversionFilter !== 'all' && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                    Conversion: {conversionFilter}
                  </span>
                )}
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                  {timeRange} range
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ExportDropdown data={filteredExportData} />
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

      {/* KPI Cards - Only show if property selected */}
      {selectedProperty && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketingKPIs.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{metric.title}</p>
                  <p className="text-slate-900 text-3xl font-bold mt-1">{metric.value}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-4 h-4 ${metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`} />
                  <span className={`text-sm font-medium ${metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Section - Only show if property selected */}
      {selectedProperty && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sessions Over Time */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Sessions Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={metrics.length > 0 ? metrics : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#3B82F6" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Traffic Sources</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Direct', value: 4567, fill: '#3B82F6' },
                    { name: 'Organic Search', value: 3421, fill: '#10B981' },
                    { name: 'Social Media', value: 2134, fill: '#F59E0B' },
                    { name: 'Referral', value: 1876, fill: '#EF4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                />
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab Content - only show if property is selected */}
      {selectedPropertyId && (
      <>
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
                    paddingAngle={5}
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
                {finalTrafficSourcesData.map((source) => (
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
                  <BarChart data={finalTrafficSourcesData}>
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
                  {finalTrafficSourcesData.map(source => (
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
                    <BarChart data={finalTrafficSourcesData.map(source => ({
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
                      onClick={() => setShowGAForm(true)}
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
      </>
      )}

      {/* Add Property Modal */}
      <AddPropertyForm
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onSuccess={handleAddPropertySuccess}
      />
    </div>
  );
}