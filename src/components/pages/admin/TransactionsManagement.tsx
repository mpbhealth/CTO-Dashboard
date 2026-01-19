import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  DollarSign,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

interface Transaction {
  id: string;
  reference_number: string;
  member_name: string;
  transaction_type: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_method: string;
  description: string;
  created_at: string;
  processed_date: string | null;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-700', icon: RefreshCw },
};

const typeColors: Record<string, string> = {
  membership_fee: 'bg-blue-50 text-blue-700',
  claim_payment: 'bg-emerald-50 text-emerald-700',
  refund: 'bg-purple-50 text-purple-700',
  adjustment: 'bg-amber-50 text-amber-700',
};

// Demo data
const demoTransactions: Transaction[] = [
  {
    id: '1',
    reference_number: 'TXN-202412-00001',
    member_name: 'John Smith',
    transaction_type: 'membership_fee',
    amount: 299.00,
    status: 'completed',
    payment_method: 'Credit Card ****4242',
    description: 'Monthly membership fee - December 2024',
    created_at: '2024-12-01T00:01:00Z',
    processed_date: '2024-12-01T00:01:30Z',
  },
  {
    id: '2',
    reference_number: 'TXN-202412-00002',
    member_name: 'Sarah Johnson',
    transaction_type: 'membership_fee',
    amount: 199.00,
    status: 'completed',
    payment_method: 'ACH Bank Transfer',
    description: 'Monthly membership fee - December 2024',
    created_at: '2024-12-01T00:02:00Z',
    processed_date: '2024-12-01T00:02:45Z',
  },
  {
    id: '3',
    reference_number: 'TXN-202412-00003',
    member_name: 'Michael Williams',
    transaction_type: 'claim_payment',
    amount: 1250.00,
    status: 'pending',
    payment_method: 'ACH Bank Transfer',
    description: 'Claim payment - CLM-202411-00098',
    created_at: '2024-12-04T14:30:00Z',
    processed_date: null,
  },
  {
    id: '4',
    reference_number: 'TXN-202412-00004',
    member_name: 'Emily Davis',
    transaction_type: 'refund',
    amount: -150.00,
    status: 'completed',
    payment_method: 'Credit Card ****8888',
    description: 'Refund for overpayment',
    created_at: '2024-12-03T10:15:00Z',
    processed_date: '2024-12-03T10:20:00Z',
  },
  {
    id: '5',
    reference_number: 'TXN-202412-00005',
    member_name: 'David Brown',
    transaction_type: 'membership_fee',
    amount: 299.00,
    status: 'failed',
    payment_method: 'Credit Card ****1234',
    description: 'Monthly membership fee - December 2024',
    created_at: '2024-12-01T00:05:00Z',
    processed_date: null,
  },
];

export function TransactionsManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      let filtered = [...demoTransactions];

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(t =>
          t.reference_number.toLowerCase().includes(search) ||
          t.member_name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === statusFilter);
      }

      if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.transaction_type === typeFilter);
      }

      setTotalCount(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setTransactions(filtered.slice(start, start + pageSize));
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('transactions')
        .select('*, member_profiles(first_name, last_name)', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`reference_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('transaction_type', typeFilter);
      }

      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;

      const formattedTransactions = (data || []).map((t: Record<string, unknown>) => ({
        ...t,
        member_name: t.member_profiles
          ? `${(t.member_profiles as Record<string, string>).first_name} ${(t.member_profiles as Record<string, string>).last_name}`
          : 'Unknown Member',
      }));

      setTransactions(formattedTransactions as Transaction[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions(demoTransactions);
      setTotalCount(demoTransactions.length);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, dateRange, currentPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Calculate stats
  const totalRevenue = demoTransactions
    .filter(t => t.status === 'completed' && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const pendingAmount = demoTransactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const completedCount = demoTransactions.filter(t => t.status === 'completed').length;
  const failedCount = demoTransactions.filter(t => t.status === 'failed').length;

  const handleExportCSV = () => {
    const headers = ['Reference', 'Member', 'Type', 'Amount', 'Status', 'Payment Method', 'Date'];
    const rows = transactions.map(t => [
      t.reference_number,
      t.member_name,
      t.transaction_type,
      t.amount.toFixed(2),
      t.status,
      t.payment_method,
      new Date(t.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 mt-1">View and manage payment transactions</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-700">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-emerald-600">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-700">
                ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-amber-600">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-700">{completedCount}</p>
              <p className="text-sm text-blue-600">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-700">{failedCount}</p>
              <p className="text-sm text-red-600">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, member, description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="membership_fee">Membership Fee</option>
              <option value="claim_payment">Claim Payment</option>
              <option value="refund">Refund</option>
              <option value="adjustment">Adjustment</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>

            <button
              onClick={fetchTransactions}
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
                    <p className="text-slate-500 mt-2">Loading transactions...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-slate-500 mt-2">No transactions found</p>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const statusInfo = statusConfig[transaction.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-sm font-medium text-slate-900">
                            {transaction.reference_number}
                          </p>
                          <p className="text-sm text-slate-500">{transaction.member_name}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            <CreditCard className="w-3 h-3 inline mr-1" />
                            {transaction.payment_method}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          inline-flex px-2.5 py-1 text-xs font-semibold rounded-full capitalize
                          ${typeColors[transaction.transaction_type] || 'bg-slate-100 text-slate-600'}
                        `}>
                          {transaction.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          text-lg font-bold
                          ${transaction.amount < 0 ? 'text-purple-600' : 'text-slate-900'}
                        `}>
                          {transaction.amount < 0 ? '-' : ''}
                          ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full
                          ${statusInfo.color}
                        `}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} transactions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionsManagement;

