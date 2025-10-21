import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Target, Users, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const salesData = [
  { month: 'Apr', revenue: 385000, target: 400000, deals: 42 },
  { month: 'May', revenue: 412000, target: 420000, deals: 48 },
  { month: 'Jun', revenue: 434200, target: 440000, deals: 51 },
  { month: 'Jul', revenue: 487250, target: 460000, deals: 58 },
];

const pipelineStages = [
  { stage: 'Prospecting', count: 125, value: 1250000 },
  { stage: 'Qualification', count: 78, value: 980000 },
  { stage: 'Proposal', count: 45, value: 675000 },
  { stage: 'Negotiation', count: 22, value: 440000 },
  { stage: 'Closed Won', count: 58, value: 487250 },
];

export default function CEOSales() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Sales Performance</h1>
        <select className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option>Last 30 Days</option>
          <option>Last Quarter</option>
          <option>Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(487250)}</p>
          <p className="text-xs text-emerald-600 mt-1">+12.3% vs last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium">Deals Closed</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">58</p>
          <p className="text-xs text-blue-600 mt-1">+8 vs last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium">Avg Deal Size</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(8401)}</p>
          <p className="text-xs text-amber-600 mt-1">+3.2% vs last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-sky-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium">Active Pipeline</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">270</p>
          <p className="text-xs text-sky-600 mt-1">{formatCurrency(3345000)} value</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Actual Revenue" />
              <Line type="monotone" dataKey="target" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Sales Pipeline by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineStages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
