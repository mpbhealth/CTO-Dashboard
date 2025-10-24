import { useState } from 'react';
import { Target, Plus, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';

export function CEOMarketingPlanner() {
  const [campaigns] = useState([
    {
      id: '1',
      name: 'Q4 Growth Campaign',
      status: 'Active',
      budget: 45000,
      spent: 32400,
      leads: 847,
      startDate: '2025-10-01',
      endDate: '2025-12-31',
      channels: ['Digital Ads', 'Email', 'Content'],
    },
    {
      id: '2',
      name: 'Healthcare Partner Outreach',
      status: 'Active',
      budget: 28000,
      spent: 14200,
      leads: 423,
      startDate: '2025-10-15',
      endDate: '2025-11-30',
      channels: ['Events', 'Partner Marketing'],
    },
    {
      id: '3',
      name: 'Member Retention Initiative',
      status: 'Planning',
      budget: 15000,
      spent: 0,
      leads: 0,
      startDate: '2025-11-01',
      endDate: '2025-12-15',
      channels: ['Email', 'Social Media'],
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Planning': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <CEODashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Planner</h1>
            <p className="text-gray-600 mt-1">Plan and manage marketing campaigns</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={18} />
            New Campaign
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-2">
              <Target size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-green-600">+12%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'Active').length}</div>
            <div className="text-sm text-gray-500 mt-1">Active Campaigns</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-600">+24%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{campaigns.reduce((sum, c) => sum + c.leads, 0).toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Total Leads</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-600">72%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${campaigns.reduce((sum, c) => sum + c.spent, 0).toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Total Spend</div>
          </div>
        </div>

        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const progress = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
            return (
              <div key={campaign.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {campaign.startDate} to {campaign.endDate}
                      </div>
                      <div className="flex gap-1">
                        {campaign.channels.map((channel) => (
                          <span key={channel} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Budget</div>
                    <div className="text-lg font-semibold text-gray-900">${campaign.budget.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Spent</div>
                    <div className="text-lg font-semibold text-gray-900">${campaign.spent.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Leads</div>
                    <div className="text-lg font-semibold text-gray-900">{campaign.leads.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${progress > 90 ? 'bg-red-600' : progress > 75 ? 'bg-yellow-600' : 'bg-green-600'}`}
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
    </CEODashboardLayout>
  );
}
