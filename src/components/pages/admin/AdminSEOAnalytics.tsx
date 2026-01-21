import {
  Search,
  TrendingUp,
  TrendingDown,
  Globe,
  Link,
  FileText,
  BarChart3,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';

interface KeywordData {
  keyword: string;
  position: number;
  change: number;
  volume: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const topKeywords: KeywordData[] = [
  { keyword: 'health insurance florida', position: 3, change: 2, volume: 12500, difficulty: 'hard' },
  { keyword: 'affordable health plans', position: 5, change: -1, volume: 8900, difficulty: 'medium' },
  { keyword: 'mpb health benefits', position: 1, change: 0, volume: 3200, difficulty: 'easy' },
  { keyword: 'family health coverage miami', position: 8, change: 4, volume: 5600, difficulty: 'medium' },
  { keyword: 'dental insurance florida', position: 12, change: -3, volume: 7800, difficulty: 'hard' },
];

const backlinks = [
  { domain: 'healthnews.com', da: 72, links: 15, type: 'Editorial' },
  { domain: 'insuranceguide.org', da: 65, links: 8, type: 'Resource' },
  { domain: 'floridabusiness.com', da: 58, links: 12, type: 'Press' },
  { domain: 'healthcare.gov', da: 91, links: 3, type: 'Government' },
];

export function AdminSEOAnalytics() {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-100 text-emerald-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SEO Analytics</h1>
        <p className="text-slate-500 mt-1">Search engine optimization performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Domain Authority</p>
              <p className="text-2xl font-bold text-slate-900">54</p>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-emerald-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            +3 this month
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ranking Keywords</p>
              <p className="text-2xl font-bold text-slate-900">847</p>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-emerald-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            +42 new
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Link className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Backlinks</p>
              <p className="text-2xl font-bold text-slate-900">1,234</p>
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-emerald-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            +89 this month
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Indexed Pages</p>
              <p className="text-2xl font-bold text-slate-900">156</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top Ranking Keywords</h3>
          <div className="space-y-3">
            {topKeywords.map((kw) => (
              <div key={kw.keyword} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{kw.keyword}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{kw.volume.toLocaleString()} searches/mo</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getDifficultyColor(kw.difficulty)}`}>
                      {kw.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">#{kw.position}</p>
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    kw.change > 0 ? 'text-emerald-600' : kw.change < 0 ? 'text-red-600' : 'text-slate-400'
                  }`}>
                    {kw.change > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> :
                     kw.change < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
                    {kw.change !== 0 && Math.abs(kw.change)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backlinks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top Backlinks</h3>
          <div className="space-y-3">
            {backlinks.map((link) => (
              <div key={link.domain} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{link.domain}</p>
                    <p className="text-xs text-slate-500">{link.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">DA {link.da}</p>
                    <p className="text-xs text-slate-500">{link.links} links</p>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Organic Traffic Chart Placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Organic Traffic Trend</h3>
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Organic traffic trend visualization</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSEOAnalytics;
