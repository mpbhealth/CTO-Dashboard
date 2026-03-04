import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import {
  Users, UserCheck, Smartphone, TrendingUp, TrendingDown, Ban,
  Loader2, AlertCircle, RefreshCw, Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  useMemberOverview,
  useMemberGrowth,
  useAppAdoption,
  useProductDistribution,
  useMonthlyActivity,
} from '../../hooks/useMemberAnalytics';

const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

export default function MemberEngagement() {
  const [growthRange, setGrowthRange] = useState(12);
  const overview = useMemberOverview();
  const growth = useMemberGrowth(growthRange);
  const adoption = useAppAdoption(18);
  const products = useProductDistribution();
  const activity = useMonthlyActivity(6);

  const isLoading = overview.loading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600">Loading member analytics...</span>
      </div>
    );
  }

  if (overview.error && !overview.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Data</h3>
        <p className="text-slate-500 mb-4 max-w-md">{overview.error}</p>
        <button
          type="button"
          onClick={() => { overview.refetch(); growth.refetch(); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const ov = overview.data;
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Member Engagement</h1>
        <p className="text-slate-600 mt-2">Real-time member data from MPB Health platform</p>
      </div>

      {/* ═══════════════ MEMBER OVERVIEW ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-indigo-600 rounded" />
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Member Overview</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Primary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl border-2 border-emerald-200 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{ov?.activePrimary.toLocaleString()}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-3">Active Primary</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Active dependents</span>
                <span className="font-medium text-emerald-600">{ov?.activeDependents.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total active</span>
                <span className="font-medium">{ov?.activeMembers.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Registered on App */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-xl border-2 border-blue-200 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{ov?.appUsers.toLocaleString()}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-3">Registered on App</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Primary</span>
                <span className="font-medium">{ov?.appPrimary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Dependents</span>
                <span className="font-medium">{ov?.appDependents.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Currently Active */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-xl border-2 border-green-200 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{ov?.activeMembers.toLocaleString()}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-3">Currently Active</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Inactivating this month</span>
                <span className={`font-medium ${(ov?.inactivatingThisMonth ?? 0) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {ov?.inactivatingThisMonth ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Starting next month (included)</span>
                <span className="font-medium text-emerald-600">{ov?.startingNextMonth ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Scheduled future (not added)</span>
                <span className="font-medium">{ov?.scheduledFuture ?? 0}</span>
              </div>
            </div>
          </motion.div>

          {/* Inactive Plans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-xl border-2 border-slate-200 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-slate-500" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{ov?.inactiveMembers.toLocaleString()}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-3">Inactive Plans</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Currently inactive</span>
                <span className="font-medium">{ov?.inactiveMembers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Scheduled to expire</span>
                <span className={`font-medium ${(ov?.scheduledToExpire ?? 0) > 0 ? 'text-red-500' : ''}`}>
                  {ov?.scheduledToExpire ?? 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════ THIS MONTH'S ACTIVITY ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-amber-500 rounded" />
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">This Month&apos;s Activity</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Activated */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-white rounded-xl border-2 border-emerald-200 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-3xl font-bold text-emerald-600">{ov?.activatedThisMonth ?? 0}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-3">Activated This Month</p>
            <div className="mt-1 text-xs text-slate-500 flex justify-between">
              <span>New plan activations</span>
              <span className="font-medium text-emerald-600">{ov?.activatedThisMonth ?? 0}</span>
            </div>
          </motion.div>

          {/* Inactivated */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-white rounded-xl border-2 border-red-200 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-3xl font-bold text-red-500">{ov?.inactivatedThisMonth ?? 0}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-3">Inactivated This Month</p>
            <div className="mt-1 text-xs text-slate-500 flex justify-between">
              <span>Plans cancelled/expired</span>
              <span className="font-medium text-red-500">{ov?.inactivatedThisMonth ?? 0}</span>
            </div>
          </motion.div>

          {/* Net Change */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className={`rounded-xl p-5 text-white ${
              (ov?.netChange ?? 0) >= 0
                ? 'bg-gradient-to-br from-teal-600 to-indigo-700'
                : 'bg-gradient-to-br from-red-600 to-rose-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-3xl font-bold">
                {(ov?.netChange ?? 0) > 0 ? '+' : ''}{ov?.netChange ?? 0}
              </span>
            </div>
            <p className="text-sm font-semibold mt-3">Net Change</p>
            <div className="mt-1 text-xs opacity-80 flex justify-between">
              <span>{currentMonth}</span>
              <span className="flex items-center gap-1">
                {(ov?.netChange ?? 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {(ov?.netChange ?? 0) >= 0 ? 'Growing' : 'Declining'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════ MONTHLY TRENDS ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-indigo-600 rounded" />
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Monthly Trends</h2>
        </div>

        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-semibold text-slate-900">
              Activations vs Inactivations — Last 6 Months
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={activity.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line
                type="monotone"
                dataKey="activations"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ fill: '#10B981', r: 4 }}
                name="Activations"
              />
              <Line
                type="monotone"
                dataKey="inactivations"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ fill: '#6366F1', r: 4 }}
                name="Inactivations"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ═══════════════ GROWTH & DISTRIBUTION ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Member Growth */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Member Growth</h3>
              <p className="text-xs text-slate-500">New enrollments over time</p>
            </div>
            <select
              value={growthRange}
              onChange={(e) => setGrowthRange(Number(e.target.value))}
              aria-label="Growth time range"
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growth.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="primaryMembers" stackId="a" fill="#6366F1" name="Primary" />
              <Bar dataKey="dependents" stackId="a" fill="#F59E0B" name="Dependents" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* App Adoption */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">App Registrations</h3>
            <p className="text-xs text-slate-500">Monthly app sign-ups</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={adoption.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="adoptionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="registrations"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#adoptionGradient)"
                name="Registrations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Product Distribution */}
      {products.data.length > 0 && (
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">Members by Product Plan</h3>
            <p className="text-xs text-slate-500">Distribution across health plans</p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(300, products.data.length * 45)}>
            <BarChart data={products.data} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" stroke="#64748B" fontSize={12} />
              <YAxis dataKey="product" type="category" stroke="#64748B" fontSize={11} width={115} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="active" stackId="a" fill="#10B981" name="Active" />
              <Bar dataKey="inactive" stackId="a" fill="#EF4444" name="Inactive" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
