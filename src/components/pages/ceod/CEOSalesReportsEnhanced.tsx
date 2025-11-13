import { useState, useMemo } from 'react';
import { ShoppingCart, Download, TrendingUp, DollarSign, Users, Target, Award, UserPlus, UserMinus, Phone, FileSpreadsheet, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ExportModal } from '../../modals/ExportModal';
import { FileViewerModal } from '../../modals/FileViewerModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, FunnelChart, Funnel, LabelList } from 'recharts';

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

interface SalesLead {
  staging_id: string;
  lead_date: string | null;
  lead_name: string | null;
  lead_source: string | null;
  source_category: string | null;
  lead_status: string | null;
  lead_owner: string | null;
  is_group_lead: boolean;
  recent_notes: string | null;
  note_action_type: string | null;
}

interface SalesCancelation {
  staging_id: string;
  member_name: string | null;
  cancelation_reason: string | null;
  reason_category: string | null;
  is_preventable: boolean;
  membership_type: string | null;
  advisor_name: string | null;
  outcome_notes: string | null;
  outcome_type: string | null;
  retention_opportunity_score: number;
}

const COLORS = ['#1a3d97', '#00A896', '#02c9b3', '#2851c7', '#007f6d'];

export function CEOSalesReportsEnhanced() {
  const [activeTab, setActiveTab] = useState<'orders' | 'leads' | 'churn'>('orders');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRep, setSelectedRep] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileData, setFileData] = useState<any[]>([]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
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

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['sales_leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .order('lead_date', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as SalesLead[];
    },
  });

  const { data: cancelations = [], isLoading: cancelationsLoading } = useQuery({
    queryKey: ['sales_cancelations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_cancelations')
        .select('*')
        .limit(1000);

      if (error) throw error;
      return data as SalesCancelation[];
    },
  });

  const { data: uploadedFiles = [] } = useQuery({
    queryKey: ['department_uploads', 'sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_uploads')
        .select('*')
        .in('department', ['sales', 'sales-leads', 'sales-cancelations'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const handleViewFile = async (file: any) => {
    setSelectedFile(file);

    let tableName = '';
    if (file.department === 'sales') tableName = 'sales_orders';
    else if (file.department === 'sales-leads') tableName = 'sales_leads';
    else if (file.department === 'sales-cancelations') tableName = 'sales_cancelations';

    if (tableName) {
      const { data } = await supabase
        .from(tableName)
        .select('*')
        .limit(1000);

      setFileData(data || []);
    }
  };

  const handleDownloadFile = () => {
    if (!fileData || fileData.length === 0) return;

    const headers = Object.keys(fileData[0]);
    const csvContent = [
      headers.join(','),
      ...fileData.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile?.file_name || 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (dateFrom && order.order_date && order.order_date < dateFrom) return false;
      if (dateTo && order.order_date && order.order_date > dateTo) return false;
      if (selectedRep && order.rep !== selectedRep) return false;
      if (selectedChannel && order.channel !== selectedChannel) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo, selectedRep, selectedChannel]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (dateFrom && lead.lead_date && lead.lead_date < dateFrom) return false;
      if (dateTo && lead.lead_date && lead.lead_date > dateTo) return false;
      if (selectedRep && lead.lead_owner !== selectedRep) return false;
      return true;
    });
  }, [leads, dateFrom, dateTo, selectedRep]);

  const unifiedMetrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const mtdOrders = filteredOrders.filter((o) => {
      if (!o.order_date) return false;
      const orderDate = new Date(o.order_date);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const mtdLeads = filteredLeads.filter((l) => {
      if (!l.lead_date) return false;
      const leadDate = new Date(l.lead_date);
      return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
    });

    const mtdSales = mtdOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalPipeline = filteredLeads.length * 250;
    const conversionRate = mtdLeads.length > 0 ? (mtdOrders.length / mtdLeads.length) * 100 : 0;
    const churnRate = orders.length > 0 ? (cancelations.length / orders.length) * 100 : 0;

    return {
      mtdSales,
      totalPipeline,
      conversionRate,
      churnRate,
    };
  }, [filteredOrders, filteredLeads, orders, cancelations]);

  const leadSourceData = useMemo(() => {
    const sourceTotals: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      const source = lead.lead_source || 'Unknown';
      sourceTotals[source] = (sourceTotals[source] || 0) + 1;
    });
    return Object.entries(sourceTotals).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const leadStatusFunnel = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      const status = lead.lead_status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const cancelationReasons = useMemo(() => {
    const reasonCounts: Record<string, number> = {};
    cancelations.forEach((c) => {
      const reason = c.cancelation_reason || 'Unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    return Object.entries(reasonCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [cancelations]);

  const advisorRetention = useMemo(() => {
    const advisorStats: Record<string, { total: number; retained: number }> = {};
    cancelations.forEach((c) => {
      const advisor = c.advisor_name || 'Unknown';
      if (!advisorStats[advisor]) {
        advisorStats[advisor] = { total: 0, retained: 0 };
      }
      advisorStats[advisor].total += 1;
      if (c.outcome_type === 'Retained') {
        advisorStats[advisor].retained += 1;
      }
    });
    return Object.entries(advisorStats)
      .map(([advisor, stats]) => ({
        advisor,
        retentionRate: stats.total > 0 ? (stats.retained / stats.total) * 100 : 0,
        total: stats.total,
      }))
      .sort((a, b) => b.retentionRate - a.retentionRate)
      .slice(0, 5);
  }, [cancelations]);

  const isLoading = ordersLoading || leadsLoading || cancelationsLoading;

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
            Sales Intelligence Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Complete sales pipeline from lead to churn analysis</p>
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
            <span className="text-xs font-medium text-gray-500">MTD SALES</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${(unifiedMetrics.mtdSales / 1000).toFixed(1)}K</div>
          <div className="text-sm text-gray-500">This Month</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-[#00A896]" size={20} />
            <span className="text-xs font-medium text-gray-500">PIPELINE</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${(unifiedMetrics.totalPipeline / 1000).toFixed(1)}K</div>
          <div className="text-sm text-gray-500">{filteredLeads.length} Leads</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-green-600" size={20} />
            <span className="text-xs font-medium text-gray-500">CONVERSION</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{unifiedMetrics.conversionRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">Lead to Sale</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <UserMinus className="text-amber-600" size={20} />
            <span className="text-xs font-medium text-gray-500">CHURN</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{unifiedMetrics.churnRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">{cancelations.length} Canceled</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'text-[#1a3d97] border-b-2 border-[#1a3d97] bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart className="inline-block mr-2" size={16} />
            Sales Orders
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'leads'
                ? 'text-[#00A896] border-b-2 border-[#00A896] bg-green-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <UserPlus className="inline-block mr-2" size={16} />
            Lead Pipeline
          </button>
          <button
            onClick={() => setActiveTab('churn')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'churn'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <UserMinus className="inline-block mr-2" size={16} />
            Churn Analysis
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rep</label>
                    <select
                      value={selectedRep}
                      onChange={(e) => setSelectedRep(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Reps</option>
                      {Array.from(new Set(orders.map((o) => o.rep).filter(Boolean)))
                        .sort()
                        .map((rep) => (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Channels</option>
                      {Array.from(new Set(orders.map((o) => o.channel).filter(Boolean)))
                        .sort()
                        .map((channel) => (
                          <option key={channel} value={channel!}>
                            {channel}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rep</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.slice(0, 50).map((order) => (
                        <tr key={order.staging_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                          </td>
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
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Sources</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={leadSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leadSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Status Pipeline</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={leadStatusFunnel}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#00A896" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No leads found
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.slice(0, 50).map((lead) => (
                        <tr key={lead.staging_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {lead.lead_date ? new Date(lead.lead_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{lead.lead_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{lead.lead_source || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              {lead.lead_status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{lead.lead_owner || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'churn' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Cancelation Reasons</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={cancelationReasons} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Advisor Retention Performance</h3>
                  <div className="space-y-3">
                    {advisorRetention.map((advisor, index) => (
                      <div key={advisor.advisor} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-600 to-[#00A896] text-white text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{advisor.advisor}</span>
                          </div>
                          <span className="text-sm font-bold text-amber-600">
                            {advisor.retentionRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 ml-8">{advisor.total} attempts</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Advisor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cancelations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No cancelations found
                        </td>
                      </tr>
                    ) : (
                      cancelations.slice(0, 50).map((cancel) => (
                        <tr key={cancel.staging_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{cancel.member_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cancel.cancelation_reason || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cancel.membership_type || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cancel.advisor_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                cancel.outcome_type === 'Retained'
                                  ? 'bg-green-100 text-green-800'
                                  : cancel.outcome_type === 'Positive Exit'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {cancel.outcome_type || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-[#1a3d97]" />
            Uploaded Files
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file: any) => (
              <div
                key={file.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-[#1a3d97] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm truncate" title={file.file_name}>
                      {file.file_name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      file.department === 'sales'
                        ? 'bg-blue-100 text-blue-800'
                        : file.department === 'sales-leads'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {file.department === 'sales'
                      ? 'Orders'
                      : file.department === 'sales-leads'
                      ? 'Leads'
                      : 'Cancelations'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                  <span>{file.row_count} rows</span>
                  <span className={file.status === 'completed' ? 'text-green-600' : 'text-gray-500'}>
                    {file.status}
                  </span>
                </div>
                <button
                  onClick={() => handleViewFile(file)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  <Eye size={14} />
                  View Data
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showExportModal && (
        <ExportModal
          data={
            activeTab === 'orders'
              ? filteredOrders
              : activeTab === 'leads'
              ? filteredLeads
              : cancelations
          }
          filename={`sales_${activeTab}`}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {selectedFile && (
        <FileViewerModal
          file={selectedFile}
          data={fileData}
          onClose={() => {
            setSelectedFile(null);
            setFileData([]);
          }}
          onDownload={handleDownloadFile}
        />
      )}
    </div>
  );
}
