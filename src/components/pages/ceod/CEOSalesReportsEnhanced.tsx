import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Download, TrendingUp, DollarSign, Users, Target, Award, UserPlus, UserMinus, Phone, FileSpreadsheet, Eye, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
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
  
  // Mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setViewMode('cards');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-[#1a3d97] mx-auto"></div>
          <p className="text-gray-500 text-sm mt-3">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Header - Stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <ShoppingCart className="text-[#1a3d97]" size={24} />
            <span className="truncate">Sales Intelligence</span>
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Complete sales pipeline from lead to churn analysis
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="
            flex items-center justify-center gap-2 
            px-4 py-3 sm:py-2.5
            bg-gradient-to-r from-[#1a3d97] to-[#00A896] 
            text-white rounded-xl 
            hover:opacity-90 active:scale-[0.98]
            transition-all duration-200
            font-medium text-sm
            min-h-[44px]
            touch-manipulation
            w-full sm:w-auto
          "
        >
          <Download size={18} />
          Export Data
        </button>
      </div>

      {/* KPI Cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl md:rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-[#1a3d97] transition-colors">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <DollarSign className="text-[#1a3d97]" size={16} />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-500">MTD SALES</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900">${(unifiedMetrics.mtdSales / 1000).toFixed(1)}K</div>
          <div className="text-xs sm:text-sm text-gray-500">This Month</div>
        </div>

        <div className="bg-white rounded-xl md:rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-[#00A896] transition-colors">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="p-1.5 bg-teal-50 rounded-lg">
              <Target className="text-[#00A896]" size={16} />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-500">PIPELINE</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900">${(unifiedMetrics.totalPipeline / 1000).toFixed(1)}K</div>
          <div className="text-xs sm:text-sm text-gray-500">{filteredLeads.length} Leads</div>
        </div>

        <div className="bg-white rounded-xl md:rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-green-500 transition-colors">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="p-1.5 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={16} />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-500">CONVERSION</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900">{unifiedMetrics.conversionRate.toFixed(1)}%</div>
          <div className="text-xs sm:text-sm text-gray-500">Lead to Sale</div>
        </div>

        <div className="bg-white rounded-xl md:rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-amber-500 transition-colors">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <UserMinus className="text-amber-600" size={16} />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-500">CHURN</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900">{unifiedMetrics.churnRate.toFixed(1)}%</div>
          <div className="text-xs sm:text-sm text-gray-500">{cancelations.length} Canceled</div>
        </div>
      </div>

      <div className="bg-white rounded-xl md:rounded-lg border border-gray-200 overflow-hidden">
        {/* Scrollable tab bar on mobile */}
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('orders')}
            className={`
              flex-1 min-w-[120px] px-4 sm:px-6 py-3.5 sm:py-3 
              text-xs sm:text-sm font-medium 
              transition-colors whitespace-nowrap
              touch-manipulation
              ${activeTab === 'orders'
                ? 'text-[#1a3d97] border-b-2 border-[#1a3d97] bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
              }
            `}
          >
            <ShoppingCart className="inline-block mr-1.5 sm:mr-2" size={14} />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`
              flex-1 min-w-[120px] px-4 sm:px-6 py-3.5 sm:py-3 
              text-xs sm:text-sm font-medium 
              transition-colors whitespace-nowrap
              touch-manipulation
              ${activeTab === 'leads'
                ? 'text-[#00A896] border-b-2 border-[#00A896] bg-green-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
              }
            `}
          >
            <UserPlus className="inline-block mr-1.5 sm:mr-2" size={14} />
            Leads
          </button>
          <button
            onClick={() => setActiveTab('churn')}
            className={`
              flex-1 min-w-[120px] px-4 sm:px-6 py-3.5 sm:py-3 
              text-xs sm:text-sm font-medium 
              transition-colors whitespace-nowrap
              touch-manipulation
              ${activeTab === 'churn'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
              }
            `}
          >
            <UserMinus className="inline-block mr-1.5 sm:mr-2" size={14} />
            Churn
          </button>
        </div>

        <div className="p-3 sm:p-6">
          {activeTab === 'orders' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Collapsible Filters */}
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="
                    flex items-center justify-between w-full
                    text-sm font-semibold text-gray-900
                    md:cursor-default
                  "
                >
                  <span>Filters</span>
                  <span className="md:hidden flex items-center gap-2">
                    {(dateFrom || dateTo || selectedRep || selectedChannel) && (
                      <span className="w-2 h-2 bg-[#1a3d97] rounded-full"></span>
                    )}
                    {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>
                <div className={`${showFilters || !isMobile ? 'block' : 'hidden'} mt-3`}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">From Date</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">To Date</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Rep</label>
                      <select
                        value={selectedRep}
                        onChange={(e) => setSelectedRep(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm min-h-[44px]"
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
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Channel</label>
                      <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm min-h-[44px]"
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
              </div>

              {/* View Mode Toggle - Mobile only */}
              <div className="flex items-center justify-between md:hidden">
                <span className="text-sm text-gray-600">{filteredOrders.length} orders</span>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <LayoutGrid size={16} className={viewMode === 'cards' ? 'text-[#1a3d97]' : 'text-gray-500'} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <List size={16} className={viewMode === 'table' ? 'text-[#1a3d97]' : 'text-gray-500'} />
                  </button>
                </div>
              </div>

              {/* Mobile Card View */}
              {isMobile && viewMode === 'cards' ? (
                <div className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="mx-auto mb-2 text-gray-300" size={40} />
                      <p className="text-sm">No orders found</p>
                    </div>
                  ) : (
                    filteredOrders.slice(0, 50).map((order) => (
                      <div 
                        key={order.staging_id} 
                        className="bg-gray-50 rounded-xl p-4 space-y-2 active:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{order.member_id || 'Unknown Member'}</p>
                            <p className="text-xs text-gray-500">
                              {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className="text-lg font-bold text-[#1a3d97]">
                            ${order.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="px-2 py-1 bg-white rounded-lg">{order.plan || 'N/A'}</span>
                          <span>{order.rep || 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Desktop/Table View */
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Member</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Plan</th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rep</th>
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
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-900">
                              {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-900">{order.member_id || 'N/A'}</td>
                            <td className="px-3 sm:px-4 py-3 text-sm font-bold text-[#1a3d97]">
                              ${order.amount.toFixed(2)}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-900">{order.plan || 'N/A'}</td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-900">{order.rep || 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
