import { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  PieChart,
  BarChart3,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ExportModal } from '../../modals/ExportModal';
import { FileViewerModal } from '../../modals/FileViewerModal';
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

interface FinanceRecord {
  id: string;
  record_date: string;
  category: string;
  amount: number;
  description: string | null;
  vendor_customer: string | null;
  status: string | null;
}

interface UploadedFile {
  id: string;
  file_name: string;
  batch_id: string;
  department: string;
  created_at: string;
  row_count?: number;
  status?: string;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];
const CATEGORY_COLORS: Record<string, string> = {
  revenue: '#10b981',
  ar: '#3b82f6',
  expense: '#f59e0b',
  ap: '#ef4444',
  payout: '#8b5cf6',
  other: '#6b7280',
};

export function CEOFinance() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [fileData, setFileData] = useState<Record<string, unknown>[]>([]);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['finance_records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_records')
        .select('*')
        .order('record_date', { ascending: false })
        .limit(2000);

      if (error) throw error;
      return data as FinanceRecord[];
    },
  });

  const { data: uploadedFiles = [] } = useQuery({
    queryKey: ['department_uploads', 'finance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_uploads')
        .select('*')
        .eq('department', 'finance')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const handleViewFile = async (file: UploadedFile) => {
    setSelectedFile(file);

    const { data } = await supabase
      .from('stg_finance_records')
      .select('*')
      .eq('upload_batch_id', file.batch_id)
      .limit(1000);

    setFileData(data || []);
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
    a.download = selectedFile?.file_name || 'finance_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (dateFrom && record.record_date && record.record_date < dateFrom) return false;
      if (dateTo && record.record_date && record.record_date > dateTo) return false;
      if (selectedCategory && record.category !== selectedCategory) return false;
      return true;
    });
  }, [records, dateFrom, dateTo, selectedCategory]);

  const categories = useMemo(
    () => Array.from(new Set(records.map((r) => r.category).filter(Boolean))).sort(),
    [records]
  );

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(currentMonth / 3);

    const mtdRecords = filteredRecords.filter((r) => {
      if (!r.record_date) return false;
      const date = new Date(r.record_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const _qtdRecords = filteredRecords.filter((r) => {
      if (!r.record_date) return false;
      const date = new Date(r.record_date);
      const quarter = Math.floor(date.getMonth() / 3);
      return quarter === currentQuarter && date.getFullYear() === currentYear;
    });

    const totalRevenue = filteredRecords
      .filter((r) => r.category === 'revenue')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpenses = filteredRecords
      .filter((r) => r.category === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);

    const accountsReceivable = filteredRecords
      .filter((r) => r.category === 'ar')
      .reduce((sum, r) => sum + r.amount, 0);

    const accountsPayable = filteredRecords
      .filter((r) => r.category === 'ap')
      .reduce((sum, r) => sum + r.amount, 0);

    const payouts = filteredRecords
      .filter((r) => r.category === 'payout')
      .reduce((sum, r) => sum + r.amount, 0);

    const mtdRevenue = mtdRecords
      .filter((r) => r.category === 'revenue')
      .reduce((sum, r) => sum + r.amount, 0);

    const mtdExpenses = mtdRecords
      .filter((r) => r.category === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);

    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      accountsReceivable,
      accountsPayable,
      payouts,
      mtdRevenue,
      mtdExpenses,
      profitMargin,
      netProfit,
    };
  }, [filteredRecords]);

  const monthlyTrend = useMemo(() => {
    const monthlyData: Record<string, { revenue: number; expenses: number; profit: number }> = {};

    filteredRecords.forEach((record) => {
      if (!record.record_date) return;
      const date = new Date(record.record_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
      }

      if (record.category === 'revenue') {
        monthlyData[monthKey].revenue += record.amount;
      } else if (record.category === 'expense') {
        monthlyData[monthKey].expenses += record.amount;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => (a || '').localeCompare(b || ''))
      .slice(-12)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }));
  }, [filteredRecords]);

  const categoryBreakdown = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    filteredRecords.forEach((record) => {
      const category = record.category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(record.amount);
    });
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const topVendorsCustomers = useMemo(() => {
    const vcTotals: Record<string, number> = {};
    filteredRecords
      .filter((r) => r.vendor_customer)
      .forEach((record) => {
        const vc = record.vendor_customer!;
        vcTotals[vc] = (vcTotals[vc] || 0) + Math.abs(record.amount);
      });
    return Object.entries(vcTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const cashFlowData = useMemo(() => {
    const monthlyFlow: Record<string, { inflow: number; outflow: number }> = {};

    filteredRecords.forEach((record) => {
      if (!record.record_date) return;
      const date = new Date(record.record_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyFlow[monthKey]) {
        monthlyFlow[monthKey] = { inflow: 0, outflow: 0 };
      }

      if (['revenue', 'ar'].includes(record.category)) {
        monthlyFlow[monthKey].inflow += record.amount;
      } else if (['expense', 'ap', 'payout'].includes(record.category)) {
        monthlyFlow[monthKey].outflow += Math.abs(record.amount);
      }
    });

    return Object.entries(monthlyFlow)
      .sort(([a], [b]) => (a || '').localeCompare(b || ''))
      .slice(-12)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        inflow: data.inflow,
        outflow: data.outflow,
        net: data.inflow - data.outflow,
      }));
  }, [filteredRecords]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
              <DollarSign className="text-[#1a3d97]" size={32} />
              Finance Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive financial analytics and reporting</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-emerald-600" size={20} />
              <span className="text-xs font-medium text-slate-500">REVENUE</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.totalRevenue)}</div>
            <div className="text-sm text-slate-500">Total Revenue</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="text-red-600" size={20} />
              <span className="text-xs font-medium text-slate-500">EXPENSES</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.totalExpenses)}</div>
            <div className="text-sm text-slate-500">Total Expenses</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-indigo-500" size={20} />
              <span className="text-xs font-medium text-slate-500">AR</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.accountsReceivable)}</div>
            <div className="text-sm text-slate-500">Receivables</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-amber-600" size={20} />
              <span className="text-xs font-medium text-slate-500">AP</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.accountsPayable)}</div>
            <div className="text-sm text-slate-500">Payables</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-purple-600" size={20} />
              <span className="text-xs font-medium text-slate-500">PROFIT</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.netProfit)}</div>
            <div className="text-sm text-slate-500">Net Profit</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Revenue vs Expenses (12 Months)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <PieChart size={20} />
              Category Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Cash Flow Analysis
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="inflow" fill="#10b981" name="Cash Inflow" />
                <Bar dataKey="outflow" fill="#ef4444" name="Cash Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Vendors & Customers</h2>
            <div className="w-full space-y-3 max-h-[300px] overflow-y-auto">
              {topVendorsCustomers.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[#1a3d97]">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vendor/Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No financial records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.slice(0, 50).map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.record_date ? new Date(record.record_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: CATEGORY_COLORS[record.category] + '20',
                            color: CATEGORY_COLORS[record.category] || '#6b7280',
                          }}
                        >
                          {record.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.description || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.vendor_customer || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-[#1a3d97]">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {record.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-indigo-600" />
              Uploaded Files
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file: UploadedFile) => (
                <div
                  key={file.id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors shadow-sm"
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
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Finance
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <span>{file.row_count || 0} rows</span>
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
            data={filteredRecords}
            filename="finance_records"
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

