import { useState } from 'react';
import {
  Calendar,
  BarChart3,
  DollarSign,
  Image,
  FileText,
  TrendingUp,
  Target,
  Users,
  Mail,
  MousePointer,
} from 'lucide-react';
export function CEOMarketingDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'calendar' | 'budget' | 'assets'>('overview');

  const funnelMetrics = [
    { label: 'Website Traffic', value: '47,283', trend: '+14%', icon: Users },
    { label: 'Click-Through Rate', value: '3.8%', trend: '+0.4%', icon: MousePointer },
    { label: 'Cost Per Lead', value: '$42', trend: '-8%', icon: DollarSign },
    { label: 'CAC', value: '$124', trend: '-6%', icon: Target },
    { label: 'MQL to SQL', value: '28%', trend: '+5%', icon: TrendingUp },
    { label: 'Conversion Rate', value: '4.2%', trend: '+1.1%', icon: Target },
  ];

  const campaigns = [
    {
      name: 'Q4 Growth Campaign',
      status: 'Active',
      budget: '$45,000',
      spent: '$32,400',
      leads: 847,
      startDate: '2025-10-01',
      endDate: '2025-12-31',
    },
    {
      name: 'Healthcare Partner Outreach',
      status: 'Active',
      budget: '$28,000',
      spent: '$14,200',
      leads: 423,
      startDate: '2025-10-15',
      endDate: '2025-11-30',
    },
    {
      name: 'Member Retention Initiative',
      status: 'Planning',
      budget: '$15,000',
      spent: '$0',
      leads: 0,
      startDate: '2025-11-01',
      endDate: '2025-12-15',
    },
  ];

  const contentCalendar = [
    { date: '2025-10-25', type: 'Blog Post', title: 'Healthcare Navigation Tips', status: 'Published' },
    { date: '2025-10-26', type: 'Email', title: 'Weekly Newsletter', status: 'Scheduled' },
    { date: '2025-10-27', type: 'Social Media', title: 'Member Success Story', status: 'Draft' },
    { date: '2025-10-28', type: 'Landing Page', title: 'Partner Program Launch', status: 'In Review' },
  ];

  const budgetByChannel = [
    { channel: 'Digital Ads', budget: 35000, spent: 28400, roi: 3.2 },
    { channel: 'Content Marketing', budget: 22000, spent: 18900, roi: 4.1 },
    { channel: 'Email Campaigns', budget: 15000, spent: 12300, roi: 5.8 },
    { channel: 'Events & Webinars', budget: 18000, spent: 14200, roi: 2.9 },
    { channel: 'Partner Marketing', budget: 12000, spent: 8100, roi: 3.7 },
  ];

  return (
    
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Suite</h1>
            <p className="text-gray-600 mt-1">Campaign planning, content calendar, and performance tracking</p>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
            Export Report
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'campaigns', label: 'Campaigns', icon: Target },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'budget', label: 'Budget', icon: DollarSign },
              { id: 'assets', label: 'Assets', icon: Image },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {funnelMetrics.map((metric) => {
                const Icon = metric.icon;
                const isPositive = metric.trend.startsWith('+') || metric.trend.startsWith('-');
                const trendColor = metric.trend.startsWith('+') ? 'text-green-600' : metric.trend.startsWith('-') && metric.label.includes('Cost') ? 'text-green-600' : 'text-red-600';
                return (
                  <div key={metric.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Icon size={18} className="text-gray-500" />
                      <span className={`text-sm font-medium ${trendColor}`}>{metric.trend}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    <div className="text-sm text-gray-500 mt-1">{metric.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Campaigns Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{campaigns.filter(c => c.status === 'Active').length}</div>
                  <div className="text-sm text-gray-600 mt-1">Active Campaigns</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-500">
                    {campaigns.reduce((sum, c) => sum + c.leads, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Leads</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    ${campaigns.reduce((sum, c) => sum + parseInt(c.budget.replace(/[$,]/g, '')), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Budget</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Campaign Planner</h2>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                New Campaign
              </button>
            </div>
            <div className="grid gap-4">
              {campaigns.map((campaign, index) => {
                const progress = parseInt(campaign.spent.replace(/[$,]/g, '')) / parseInt(campaign.budget.replace(/[$,]/g, '')) * 100;
                const statusColors = {
                  Active: 'bg-green-100 text-green-700',
                  Planning: 'bg-indigo-100 text-indigo-500',
                  Completed: 'bg-gray-100 text-gray-700',
                };
                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {campaign.startDate} to {campaign.endDate}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[campaign.status as keyof typeof statusColors]}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Budget</div>
                        <div className="text-lg font-semibold text-gray-900">{campaign.budget}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Spent</div>
                        <div className="text-lg font-semibold text-gray-900">{campaign.spent}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Leads</div>
                        <div className="text-lg font-semibold text-gray-900">{campaign.leads}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{Math.round(progress)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Content Calendar</h2>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Add Content
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contentCalendar.map((item, index) => {
                      const statusColors = {
                        Published: 'bg-green-100 text-green-700',
                        Scheduled: 'bg-indigo-100 text-indigo-500',
                        Draft: 'bg-gray-100 text-gray-700',
                        'In Review': 'bg-yellow-100 text-yellow-700',
                      };
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{item.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.type}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status as keyof typeof statusColors]}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button className="text-purple-600 hover:text-purple-700 font-medium">Edit</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="w-full space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Budget vs Actuals by Channel</h2>
            <div className="grid gap-4">
              {budgetByChannel.map((item) => {
                const utilization = (item.spent / item.budget) * 100;
                return (
                  <div key={item.channel} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{item.channel}</h3>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">ROI</div>
                        <div className="text-lg font-semibold text-green-600">{item.roi}x</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Budget</div>
                        <div className="text-lg font-semibold text-gray-900">${item.budget.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Spent</div>
                        <div className="text-lg font-semibold text-gray-900">${item.spent.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Remaining</div>
                        <div className="text-lg font-semibold text-gray-900">${(item.budget - item.spent).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${utilization > 90 ? 'bg-red-600' : utilization > 75 ? 'bg-yellow-600' : 'bg-green-600'}`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{Math.round(utilization)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Brand Asset Library</h2>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Upload Asset
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Brand Guidelines', 'Logo Pack', 'Ad Creatives', 'Email Templates', 'Social Media Assets', 'Presentation Decks'].map((category) => (
                <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <Image size={40} className="text-purple-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{category}</h3>
                  <p className="text-sm text-gray-500">12 files</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    
  );
}

