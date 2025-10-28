import { motion } from 'framer-motion';
import { TrendingUp, Users, MousePointer, DollarSign, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const marketingData = [
  { month: 'Apr', leads: 1250, conversions: 185, spend: 42000 },
  { month: 'May', leads: 1380, conversions: 205, spend: 45000 },
  { month: 'Jun', leads: 1420, conversions: 217, spend: 44000 },
  { month: 'Jul', leads: 1590, conversions: 234, spend: 48000 },
];

const channelPerformance = [
  { channel: 'Google Ads', leads: 485, cost: 15200, conversions: 72 },
  { channel: 'Facebook', leads: 390, cost: 12500, conversions: 58 },
  { channel: 'SEO', leads: 320, cost: 8000, conversions: 64 },
  { channel: 'Email', leads: 245, cost: 5000, conversions: 28 },
  { channel: 'Referral', leads: 150, cost: 7300, conversions: 12 },
];

export default function CEOMarketing() {
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
        <h1 className="text-3xl font-bold text-slate-900">Marketing Analytics</h1>
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
            <div className="p-3 bg-pink-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium">Total Leads</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">1,590</p>
          <p className="text-xs text-pink-600 mt-1">+12% vs last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium">Conversion Rate</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">14.7%</p>
          <p className="text-xs text-emerald-600 mt-1">+2.1% vs last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium">Marketing Spend</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(48000)}</p>
          <p className="text-xs text-amber-600 mt-1">+9% vs last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pink-500 rounded-lg">
              <MousePointer className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium">Cost per Lead</h3>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(30.19)}</p>
          <p className="text-xs text-pink-600 mt-1">-3.2% vs last month</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Lead Generation Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={marketingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} name="Leads" />
              <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} name="Conversions" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Channel Performance</h3>
          <div className="space-y-3">
            {channelPerformance.map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{channel.channel}</p>
                  <p className="text-xs text-slate-500">{channel.leads} leads • {channel.conversions} conversions</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatCurrency(channel.cost)}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(channel.cost / channel.leads)}/lead</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
