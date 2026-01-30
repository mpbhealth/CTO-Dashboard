import {
  TrendingUp,
  Target,
  DollarSign,
  MousePointer,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react';

interface CampaignData {
  name: string;
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpc: number;
}

const campaigns: CampaignData[] = [
  { name: 'Summer Health Campaign', status: 'active', impressions: 245000, clicks: 8234, conversions: 342, spend: 4500, cpc: 0.55 },
  { name: 'Medicare Open Enrollment', status: 'active', impressions: 189000, clicks: 6521, conversions: 287, spend: 3800, cpc: 0.58 },
  { name: 'Family Coverage Promo', status: 'paused', impressions: 98000, clicks: 3245, conversions: 156, spend: 2100, cpc: 0.65 },
  { name: 'Dental Benefits Awareness', status: 'completed', impressions: 156000, clicks: 5432, conversions: 234, spend: 2800, cpc: 0.52 },
];

export function AdminMarketing() {
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const avgCPC = totalSpend / totalClicks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing Analytics</h1>
          <p className="text-slate-500 mt-1">Campaign performance and ROI tracking</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
          <Calendar className="w-4 h-4" />
          Last 30 Days
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Spend</p>
              <p className="text-2xl font-bold text-slate-900">${totalSpend.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Conversions</p>
              <p className="text-2xl font-bold text-slate-900">{totalConversions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <MousePointer className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Clicks</p>
              <p className="text-2xl font-bold text-slate-900">{totalClicks.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg. CPC</p>
              <p className="text-2xl font-bold text-slate-900">${avgCPC.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Active Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Impressions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Conversions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Spend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">CPC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-slate-900">{campaign.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      campaign.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {campaign.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {campaign.clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {campaign.conversions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    ${campaign.spend.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    ${campaign.cpc.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Conversion Trends</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Conversion trend chart</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Channel Distribution</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Channel distribution chart</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMarketing;
