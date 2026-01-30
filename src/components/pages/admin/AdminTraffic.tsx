import {
  Globe,
  Search,
  Share2,
  Mail,
  MousePointer,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface TrafficSource {
  name: string;
  visitors: number;
  percentage: number;
  change: number;
  icon: React.ElementType;
  color: string;
}

const trafficSources: TrafficSource[] = [
  { name: 'Organic Search', visitors: 45234, percentage: 42, change: 12, icon: Search, color: 'from-blue-500 to-blue-600' },
  { name: 'Direct', visitors: 28921, percentage: 27, change: 5, icon: MousePointer, color: 'from-emerald-500 to-emerald-600' },
  { name: 'Social Media', visitors: 18456, percentage: 17, change: 23, icon: Share2, color: 'from-purple-500 to-purple-600' },
  { name: 'Referral', visitors: 9234, percentage: 9, change: -3, icon: ArrowUpRight, color: 'from-amber-500 to-amber-600' },
  { name: 'Email', visitors: 5543, percentage: 5, change: 8, icon: Mail, color: 'from-rose-500 to-rose-600' },
];

const topReferrers = [
  { domain: 'google.com', visits: 38234, bounce: '32%' },
  { domain: 'facebook.com', visits: 12456, bounce: '45%' },
  { domain: 'linkedin.com', visits: 8921, bounce: '28%' },
  { domain: 'healthcareinsider.com', visits: 4532, bounce: '35%' },
  { domain: 'twitter.com', visits: 3245, bounce: '52%' },
];

export function AdminTraffic() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Traffic Sources</h1>
          <p className="text-slate-500 mt-1">Analyze where your visitors are coming from</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Traffic by Source</h3>
          <div className="space-y-4">
            {trafficSources.map((source) => {
              const Icon = source.icon;
              return (
                <div key={source.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${source.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-slate-900">{source.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600">{source.visitors.toLocaleString()}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        source.change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {source.change >= 0 ? '+' : ''}{source.change}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${source.color}`}
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top Referrers</h3>
          <div className="space-y-3">
            {topReferrers.map((referrer, index) => (
              <div key={referrer.domain} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-100 rounded-full">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{referrer.domain}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{referrer.visits.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">visits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{referrer.bounce}</p>
                    <p className="text-xs text-slate-500">bounce</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Geographic Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { region: 'Florida', visitors: 68234, percentage: 65 },
            { region: 'Georgia', visitors: 15234, percentage: 14 },
            { region: 'Texas', visitors: 12456, percentage: 12 },
            { region: 'Other', visitors: 9543, percentage: 9 },
          ].map((region) => (
            <div key={region.region} className="p-4 rounded-xl bg-slate-50">
              <p className="text-sm text-slate-500">{region.region}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{region.percentage}%</p>
              <p className="text-xs text-slate-500 mt-1">{region.visitors.toLocaleString()} visitors</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminTraffic;
