import { useState, useMemo } from 'react';
import { ShoppingCart, Download, TrendingUp, DollarSign, Users, Target, Award } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ExportModal } from '../../modals/ExportModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SalesOrder {
  staging_id: string;
  order_date: string | null;
  order_id: string | null;
  member_id: string | null;
  amount: number;
  plan: string | null;
  rep: string | null;
  channel: string | null;
  status: string | null;
}

const COLORS = ['#1a3d97', '#00A896', '#02c9b3', '#2851c7', '#007f6d'];

export function CEOSalesReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRep, setSelectedRep] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .order('order_date', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as SalesOrder[];
    },
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (dateFrom && order.order_date && order.order_date < dateFrom) return false;
      if (dateTo && order.order_date && order.order_date > dateTo) return false;
      if (selectedRep && order.rep !== selectedRep) return false;
      if (selectedChannel && order.channel !== selectedChannel) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo, selectedRep, selectedChannel]);

  const reps = useMemo(
    () => Array.from(new Set(orders.map((o) => o.rep).filter(Boolean))).sort(),
    [orders]
  );

  const channels = useMemo(
    () => Array.from(new Set(orders.map((o) => o.channel).filter(Boolean))).sort(),
    [orders]
  );

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(currentMonth / 3);

    const mtdOrders = filteredOrders.filter((o) => {
      if (!o.order_date) return false;
      const orderDate = new Date(o.order_date);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const qtdOrders = filteredOrders.filter((o) => {
      if (!o.order_date) return false;
      const orderDate = new Date(o.order_date);
      const orderQuarter = Math.floor(orderDate.getMonth() / 3);
      return orderQuarter === currentQuarter && orderDate.getFullYear() === currentYear;
    });

    const mtdSales = mtdOrders.reduce((sum, o) => sum + o.amount, 0);
    const qtdSales = qtdOrders.reduce((sum, o) => sum + o.amount, 0);
    const avgDealSize = filteredOrders.length > 0 ? filteredOrders.reduce((sum, o) => sum + o.amount, 0) / filteredOrders.length : 0;
    const pipelineValue = filteredOrders.filter((o) => o.status?.toLowerCase() === 'open').reduce((sum, o) => sum + o.amount, 0);

    return {
      mtdSales,
      qtdSales,
      avgDealSize,
      pipelineValue,
    };
  }, [filteredOrders]);

  const channelData = useMemo(() => {
    const channelTotals: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      const channel = order.channel || 'Unknown';
      channelTotals[channel] = (channelTotals[channel] || 0) + order.amount;
    });
    return Object.entries(channelTotals).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const repLeaderboard = useMemo(() => {
    const repTotals: Record<string, { sales: number; deals: number }> = {};
    filteredOrders.forEach((order) => {
      const rep = order.rep || 'Unknown';
      if (!repTotals[rep]) {
        repTotals[rep] = { sales: 0, deals: 0 };
      }
      repTotals[rep].sales += order.amount;
      repTotals[rep].deals += 1;
    });
    return Object.entries(repTotals)
      .sort(([, a], [, b]) => b.sales - a.sales)
      .slice(0, 5);
  }, [filteredOrders]);

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3d97]"></div>
        </div>
      
    );
  }

  return (
    
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="text-[#1a3d97]" size={32} />
              Sales Reports & Tracking
            </h1>
            <p className="text-gray-600 mt-1">Monitor sales performance and pipeline metrics</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-[#1a3d97]" size={20} />
              <span className="text-xs font-medium text-gray-500">MTD</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${(metrics.mtdSales / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-500">This Month</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-[#00A896]" size={20} />
              <span className="text-xs font-medium text-gray-500">QTD</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${(metrics.qtdSales / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-500">This Quarter</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="text-indigo-500" size={20} />
              <span className="text-xs font-medium text-gray-500">AVG DEAL</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${metrics.avgDealSize.toFixed(0)}</div>
            <div className="text-sm text-gray-500">Deal Size</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-green-600" size={20} />
              <span className="text-xs font-medium text-gray-500">PIPELINE</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${(metrics.pipelineValue / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-500">Open Value</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rep</label>
                  <select
                    value={selectedRep}
                    onChange={(e) => setSelectedRep(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  >
                    <option value="">All Reps</option>
                    {reps.map((rep) => (
                      <option key={rep} value={rep!}>
                        {rep}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  >
                    <option value="">All Channels</option>
                    {channels.map((channel) => (
                      <option key={channel} value={channel!}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Channel Attribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(0)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rep</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.slice(0, 50).map((order) => (
                        <tr key={order.staging_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{order.order_id || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{order.member_id || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[#1a3d97]">
                            ${order.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{order.plan || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{order.rep || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Award size={20} className="text-[#1a3d97]" />
                <h3 className="text-sm font-semibold text-gray-900">Top Performers</h3>
              </div>
              <div className="w-full space-y-3">
                {repLeaderboard.map(([rep, stats], index) => (
                  <div key={rep} className="w-full space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{rep}</span>
                      </div>
                      <span className="text-sm font-bold text-[#1a3d97]">
                        ${(stats.sales / 1000).toFixed(1)}K
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 ml-8">{stats.deals} deals</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      {showExportModal && (
        <ExportModal
          data={filteredOrders}
          filename="sales_reports"
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

