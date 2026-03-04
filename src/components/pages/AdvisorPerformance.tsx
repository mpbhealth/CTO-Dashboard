import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  Award,
  ShieldCheck,
  TrendingUp,
  Search,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useAdvisorAnalytics } from '../../hooks/useMemberAnalytics';

const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

type SortKey = 'totalMembers' | 'activeMembers' | 'retentionRate' | 'name';

export default function AdvisorPerformance() {
  const { data, loading, error, refetch } = useAdvisorAnalytics();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('totalMembers');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredAdvisors = useMemo(() => {
    if (!data) return [];
    let list = data.advisors;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      const mult = sortAsc ? 1 : -1;
      if (sortBy === 'name') return mult * a.name.localeCompare(b.name);
      return mult * ((a[sortBy] as number) - (b[sortBy] as number));
    });

    return list;
  }, [data, search, sortBy, sortAsc]);

  const top20 = useMemo(() => filteredAdvisors.slice(0, 20), [filteredAdvisors]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ['Advisor', 'Agent ID', 'Total Members', 'Active', 'Inactive', 'Retention Rate (%)'],
      ...data.advisors.map(a => [a.name, a.agentId, a.totalMembers, a.activeMembers, a.inactiveMembers, a.retentionRate]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `advisor-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600">Loading advisor data...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Data</h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <button type="button" onClick={refetch} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Advisors',
      value: data?.totalAdvisors.toLocaleString() ?? '0',
      sub: 'With active members',
      icon: Users,
      color: 'bg-indigo-100 text-indigo-600',
      border: 'border-indigo-200',
    },
    {
      label: 'Avg Members / Advisor',
      value: data?.avgMembersPerAdvisor.toLocaleString() ?? '0',
      sub: 'Average portfolio size',
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-600',
      border: 'border-blue-200',
    },
    {
      label: 'Top Retention Rate',
      value: `${data?.topRetentionRate ?? 0}%`,
      sub: 'Best performing advisor (10+ members)',
      icon: Award,
      color: 'bg-emerald-100 text-emerald-600',
      border: 'border-emerald-200',
    },
    {
      label: 'Avg Retention Rate',
      value: `${data?.avgRetentionRate ?? 0}%`,
      sub: 'Across advisors with 10+ members',
      icon: ShieldCheck,
      color: 'bg-amber-100 text-amber-600',
      border: 'border-amber-200',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Advisor Performance</h1>
          <p className="text-slate-600 mt-2">Portfolio sizes, member retention, and advisor rankings</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className={`bg-white rounded-xl border-2 ${kpi.border} p-5`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-500">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Advisors by Portfolio */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Top 20 Advisors by Portfolio Size</h2>
            <p className="text-xs text-slate-500">Total members per advisor</p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(400, top20.length * 28)}>
            <BarChart data={top20} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" stroke="#64748B" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={95} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="activeMembers" stackId="a" fill="#10B981" name="Active" />
              <Bar dataKey="inactiveMembers" stackId="a" fill="#EF4444" name="Inactive" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Retention Rate Distribution */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Retention Rate by Advisor</h2>
            <p className="text-xs text-slate-500">Top 20 advisors (10+ members)</p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(400, top20.filter(a => a.totalMembers >= 10).length * 28)}>
            <BarChart
              data={top20.filter(a => a.totalMembers >= 10).sort((a, b) => b.retentionRate - a.retentionRate)}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" domain={[70, 100]} stroke="#64748B" fontSize={12} tickFormatter={v => `${v}%`} />
              <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={95} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Retention']} />
              <Bar dataKey="retentionRate" fill="#6366F1" name="Retention %" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Full Advisor Table */}
      <motion.div
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900 flex-1">All Advisors</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search advisors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">#</th>
                <ThSort label="Advisor" sortKey="name" current={sortBy} asc={sortAsc} onSort={handleSort} />
                <ThSort label="Total Members" sortKey="totalMembers" current={sortBy} asc={sortAsc} onSort={handleSort} align="right" />
                <ThSort label="Active" sortKey="activeMembers" current={sortBy} asc={sortAsc} onSort={handleSort} align="right" />
                <th className="text-right py-3 px-4 font-medium text-slate-600">Inactive</th>
                <ThSort label="Retention" sortKey="retentionRate" current={sortBy} asc={sortAsc} onSort={handleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {filteredAdvisors.slice(0, 50).map((a, i) => (
                <tr key={a.agentId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 text-slate-400 text-xs">{i + 1}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{a.name}</td>
                  <td className="py-2.5 px-4 text-right text-slate-700">{a.totalMembers.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-emerald-600 font-medium">{a.activeMembers.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right text-red-500">{a.inactiveMembers}</td>
                  <td className="py-2.5 px-4 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      a.retentionRate >= 95 ? 'bg-emerald-100 text-emerald-800' :
                      a.retentionRate >= 85 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {a.retentionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAdvisors.length > 50 && (
          <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-200">
            Showing 50 of {filteredAdvisors.length} advisors. Use search to filter.
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ThSort({
  label, sortKey, current, asc, onSort, align = 'left',
}: {
  label: string; sortKey: SortKey; current: SortKey; asc: boolean;
  onSort: (k: SortKey) => void; align?: 'left' | 'right';
}) {
  return (
    <th
      className={`py-3 px-4 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900 transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${current === sortKey ? 'text-indigo-600' : 'text-slate-400'}`} />
      </span>
    </th>
  );
}
