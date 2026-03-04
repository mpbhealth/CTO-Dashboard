import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Users,
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  Activity,
} from 'lucide-react';
import {
  useMemberOverview,
  useMemberRetentionData,
  useMonthlyActivity,
} from '../../hooks/useMemberAnalytics';

const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

export default function MemberRetention() {
  const overview = useMemberOverview();
  const retention = useMemberRetentionData();
  const activity = useMonthlyActivity(12);

  const isLoading = retention.loading || overview.loading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600">Loading retention data...</span>
      </div>
    );
  }

  if (retention.error && !retention.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Data</h3>
        <p className="text-slate-500 mb-4">{retention.error}</p>
        <button
          type="button"
          onClick={retention.refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const rd = retention.data;
  const ov = overview.data;

  const kpis = [
    {
      label: 'Retention Rate',
      value: `${rd?.retentionRate ?? 0}%`,
      sub: 'Active / total members',
      icon: ShieldCheck,
      color: 'bg-emerald-100 text-emerald-600',
      border: 'border-emerald-200',
    },
    {
      label: 'Total Churned',
      value: rd?.totalChurned.toLocaleString() ?? '0',
      sub: 'All-time inactive members',
      icon: Users,
      color: 'bg-red-100 text-red-500',
      border: 'border-red-200',
    },
    {
      label: 'Churn This Month',
      value: rd?.churnThisMonth.toLocaleString() ?? '0',
      sub: 'Inactivated in current month',
      icon: TrendingDown,
      color: 'bg-amber-100 text-amber-600',
      border: 'border-amber-200',
    },
    {
      label: 'Net Change',
      value: `${(ov?.netChange ?? 0) > 0 ? '+' : ''}${ov?.netChange ?? 0}`,
      sub: 'Activations minus inactivations',
      icon: Activity,
      color: (ov?.netChange ?? 0) >= 0 ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600',
      border: (ov?.netChange ?? 0) >= 0 ? 'border-teal-200' : 'border-red-200',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Member Retention & Churn</h1>
        <p className="text-slate-600 mt-2">Track member lifecycle, retention patterns, and churn analysis</p>
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

      {/* Activations vs Inactivations */}
      <motion.div
        className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-semibold text-slate-900">Activations vs Inactivations — Last 12 Months</h2>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={activity.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
            <YAxis stroke="#64748B" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="activations" fill="#10B981" name="Activations" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inactivations" fill="#EF4444" name="Inactivations" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Churn Reasons & Monthly Churn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Churn Reasons */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Churn Reasons</h2>
              <p className="text-xs text-slate-500">Why members leave</p>
            </div>
          </div>

          <div className="space-y-3">
            {(rd?.churnReasons ?? []).map((reason, index) => (
              <div key={reason.reason}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[70%]">{reason.reason}</span>
                  <span className="text-sm text-slate-600">{reason.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <motion.div
                    className="bg-amber-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${reason.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.05 }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{reason.count} members</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Monthly Churn Volume */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Monthly Churn Volume</h2>
              <p className="text-xs text-slate-500">Members inactivated per month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rd?.monthlyChurn ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="churned" fill="#EF4444" name="Churned" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Cohort Retention Table */}
      {(rd?.cohorts ?? []).length > 0 && (
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Cohort Retention</h2>
              <p className="text-xs text-slate-500">Retention rate by enrollment month</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Cohort</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Enrolled</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Still Active</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Retention</th>
                </tr>
              </thead>
              <tbody>
                {(rd?.cohorts ?? []).map((cohort) => (
                  <tr key={cohort.cohort} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-900">{cohort.cohort}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{cohort.totalEnrolled.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{cohort.stillActive.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        cohort.retentionRate >= 95 ? 'bg-emerald-100 text-emerald-800' :
                        cohort.retentionRate >= 85 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {cohort.retentionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
