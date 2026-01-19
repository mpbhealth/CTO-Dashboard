import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Globe,
  MousePointer2,
  FileText,
  FileSpreadsheet,
  Calendar,
  ExternalLink
} from 'lucide-react';
import RealTimeAnalytics from './RealTimeAnalytics';
import AnalyticsOverviewSection from './AnalyticsOverviewSection';
import TrafficSources from './TrafficSources';
import UserBehavior from './UserBehavior';
import PagePerformance from './PagePerformance';
import QuoteLeads from './QuoteLeads';
import { isMpbHealthConfigured } from '../../lib/mpbHealthSupabase';

type TabId = 'live' | 'overview' | 'traffic' | 'behavior' | 'pages' | 'leads';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Activity;
  description: string;
}

const tabs: Tab[] = [
  { id: 'live', label: 'Live View', icon: Activity, description: 'Real-time website activity' },
  { id: 'overview', label: 'Analytics Overview', icon: BarChart3, description: 'Traffic and performance metrics' },
  { id: 'traffic', label: 'Traffic Sources', icon: Globe, description: 'Where visitors come from' },
  { id: 'behavior', label: 'User Behavior', icon: MousePointer2, description: 'How visitors interact' },
  { id: 'pages', label: 'Page Performance', icon: FileText, description: 'Individual page analytics' },
  { id: 'leads', label: 'Quote Leads', icon: FileSpreadsheet, description: 'Lead submissions' },
];

const dateRanges = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
];

export default function WebsiteAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('live');
  const [dateRange, setDateRange] = useState('30d');
  const [showComparison, setShowComparison] = useState(true);

  // Check if MPB Health is configured
  if (!isMpbHealthConfigured) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Website Analytics Not Configured
          </h2>
          <p className="text-slate-600 mb-6">
            To view website analytics from mpb.health, please configure the following environment variables:
          </p>
          <div className="bg-slate-100 rounded-lg p-4 text-left text-sm font-mono text-slate-700">
            <p>VITE_MPB_HEALTH_SUPABASE_URL</p>
            <p>VITE_MPB_HEALTH_SUPABASE_SERVICE_KEY</p>
          </div>
          <a
            href="https://mpb.health/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 text-indigo-600 hover:text-indigo-700"
          >
            <span>View analytics on mpb.health</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'live':
        return <RealTimeAnalytics />;
      case 'overview':
        return <AnalyticsOverviewSection dateRange={dateRange} />;
      case 'traffic':
        return <TrafficSources dateRange={dateRange} />;
      case 'behavior':
        return <UserBehavior dateRange={dateRange} />;
      case 'pages':
        return <PagePerformance dateRange={dateRange} />;
      case 'leads':
        return <QuoteLeads />;
      default:
        return null;
    }
  };

  const getComparisonText = () => {
    switch (dateRange) {
      case '7d':
        return 'vs Previous 7 Days';
      case '30d':
        return 'vs Previous 30 Days';
      case '90d':
        return 'vs Previous 3 Months';
      case '1y':
        return 'vs Previous Year';
      default:
        return 'vs Previous Period';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Website Analytics</h1>
          <p className="text-slate-600 mt-1">
            Real-time insights from mpb.health website
          </p>
        </div>

        {/* Controls */}
        {activeTab !== 'live' && activeTab !== 'leads' && (
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
              <Calendar className="w-4 h-4 text-slate-400 ml-2" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none bg-transparent pr-8 py-1.5 text-sm font-medium text-slate-700 focus:outline-none"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Comparison Toggle */}
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                showComparison
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {getComparisonText()}
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-indigo-100 rounded-lg"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}
