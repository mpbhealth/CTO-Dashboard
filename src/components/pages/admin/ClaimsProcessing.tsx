import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  RefreshCw,
  DollarSign,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

interface Claim {
  id: string;
  claim_number: string;
  member_name: string;
  member_id: string;
  claim_type: string;
  status: 'submitted' | 'under_review' | 'pending_info' | 'approved' | 'partially_approved' | 'denied' | 'paid';
  provider_name: string;
  service_date: string;
  total_amount: number;
  approved_amount: number | null;
  submitted_date: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-purple-100 text-purple-700', icon: Eye },
  pending_info: { label: 'Pending Info', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  partially_approved: { label: 'Partial', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-700', icon: XCircle },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: DollarSign },
};

const priorityColors = {
  low: 'border-l-slate-300',
  normal: 'border-l-blue-400',
  high: 'border-l-amber-500',
  urgent: 'border-l-red-500',
};

// Demo data
const demoClaims: Claim[] = [
  {
    id: '1',
    claim_number: 'CLM-202412-00001',
    member_name: 'John Smith',
    member_id: '1',
    claim_type: 'Medical',
    status: 'submitted',
    provider_name: 'Austin Medical Center',
    service_date: '2024-11-28',
    total_amount: 1250.00,
    approved_amount: null,
    submitted_date: '2024-12-01T10:30:00Z',
    priority: 'high',
  },
  {
    id: '2',
    claim_number: 'CLM-202412-00002',
    member_name: 'Sarah Johnson',
    member_id: '2',
    claim_type: 'Dental',
    status: 'under_review',
    provider_name: 'Smile Dental Care',
    service_date: '2024-11-25',
    total_amount: 450.00,
    approved_amount: null,
    submitted_date: '2024-11-30T14:15:00Z',
    priority: 'normal',
  },
  {
    id: '3',
    claim_number: 'CLM-202412-00003',
    member_name: 'Michael Williams',
    member_id: '3',
    claim_type: 'Medical',
    status: 'pending_info',
    provider_name: 'Houston General Hospital',
    service_date: '2024-11-20',
    total_amount: 3500.00,
    approved_amount: null,
    submitted_date: '2024-11-28T09:00:00Z',
    priority: 'urgent',
  },
  {
    id: '4',
    claim_number: 'CLM-202411-00045',
    member_name: 'Emily Davis',
    member_id: '4',
    claim_type: 'Vision',
    status: 'approved',
    provider_name: 'Clear Vision Eye Care',
    service_date: '2024-11-15',
    total_amount: 275.00,
    approved_amount: 275.00,
    submitted_date: '2024-11-18T11:45:00Z',
    priority: 'low',
  },
  {
    id: '5',
    claim_number: 'CLM-202411-00044',
    member_name: 'David Brown',
    member_id: '5',
    claim_type: 'Medical',
    status: 'paid',
    provider_name: 'Fort Worth Clinic',
    service_date: '2024-11-10',
    total_amount: 890.00,
    approved_amount: 890.00,
    submitted_date: '2024-11-12T08:30:00Z',
    priority: 'normal',
  },
];

export function ClaimsProcessing() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'deny' | null>(null);
  const pageSize = 10;

  const fetchClaims = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      let filtered = [...demoClaims];
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(c =>
          c.claim_number.toLowerCase().includes(search) ||
          c.member_name.toLowerCase().includes(search) ||
          c.provider_name.toLowerCase().includes(search)
        );
      }

      if (statusFilter === 'pending_review') {
        filtered = filtered.filter(c => ['submitted', 'under_review', 'pending_info'].includes(c.status));
      } else if (statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === statusFilter);
      }

      setTotalCount(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setClaims(filtered.slice(start, start + pageSize));
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('claims')
        .select('*, member_profiles(first_name, last_name)', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`claim_number.ilike.%${searchTerm}%,provider_name.ilike.%${searchTerm}%`);
      }

      if (statusFilter === 'pending_review') {
        query = query.in('status', ['submitted', 'under_review', 'pending_info']);
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, count, error } = await query
        .order('submitted_date', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;

      const formattedClaims = (data || []).map((c: Record<string, unknown>) => ({
        ...c,
        member_name: c.member_profiles 
          ? `${(c.member_profiles as Record<string, string>).first_name} ${(c.member_profiles as Record<string, string>).last_name}`
          : 'Unknown Member',
      }));

      setClaims(formattedClaims as Claim[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching claims:', error);
      setClaims(demoClaims);
      setTotalCount(demoClaims.length);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Stats
  const _pendingReviewCount = demoClaims.filter(c => ['submitted', 'under_review', 'pending_info'].includes(c.status)).length;
  const approvedTodayCount = demoClaims.filter(c => c.status === 'approved').length;

  const handleApprove = (claim: Claim) => {
    setSelectedClaim(claim);
    setActionModal('approve');
  };

  const handleDeny = (claim: Claim) => {
    setSelectedClaim(claim);
    setActionModal('deny');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Claims Processing</h1>
        <p className="text-slate-500 mt-1">Review and process member claims</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{demoClaims.filter(c => c.status === 'submitted').length}</p>
              <p className="text-sm text-blue-600">Submitted</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{demoClaims.filter(c => c.status === 'under_review').length}</p>
              <p className="text-sm text-purple-600">Under Review</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{demoClaims.filter(c => c.status === 'pending_info').length}</p>
              <p className="text-sm text-amber-600">Pending Info</p>
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{approvedTodayCount}</p>
              <p className="text-sm text-emerald-600">Approved Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by claim number, member, provider..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
            >
              <option value="pending_review">Pending Review</option>
              <option value="all">All Claims</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="pending_info">Pending Info</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <button
            onClick={fetchClaims}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
            <p className="text-slate-500 mt-2">Loading claims...</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-500 mt-2">No claims found</p>
          </div>
        ) : (
          claims.map((claim) => {
            const statusInfo = statusConfig[claim.status];
            const StatusIcon = statusInfo.icon;
            const isPending = ['submitted', 'under_review', 'pending_info'].includes(claim.status);

            return (
              <div
                key={claim.id}
                className={`
                  bg-white rounded-xl border border-slate-200 p-5
                  border-l-4 ${priorityColors[claim.priority]}
                  hover:shadow-md transition-shadow
                `}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Claim Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-slate-900">
                            {claim.claim_number}
                          </span>
                          <span className={`
                            inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full
                            ${statusInfo.color}
                          `}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                          {claim.priority === 'urgent' && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                              URGENT
                            </span>
                          )}
                          {claim.priority === 'high' && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
                              HIGH
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {claim.claim_type} • {claim.provider_name}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {claim.member_name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Service: {new Date(claim.service_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Submitted: {new Date(claim.submitted_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="lg:text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      ${claim.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    {claim.approved_amount !== null && (
                      <p className="text-sm text-emerald-600 font-medium">
                        Approved: ${claim.approved_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:flex-col lg:w-32">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleApprove(claim)}
                          className="flex-1 lg:w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeny(claim)}
                          className="flex-1 lg:w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Deny
                        </button>
                      </>
                    ) : (
                      <button className="flex-1 lg:w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm">
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-6 py-4">
          <p className="text-sm text-slate-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} claims
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900">
              {actionModal === 'approve' ? 'Approve Claim' : 'Deny Claim'}
            </h3>
            <p className="text-slate-600 mt-2">
              {actionModal === 'approve' 
                ? `Are you sure you want to approve claim ${selectedClaim.claim_number}?`
                : `Are you sure you want to deny claim ${selectedClaim.claim_number}?`
              }
            </p>
            
            {actionModal === 'approve' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Approved Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    defaultValue={selectedClaim.total_amount}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
            )}

            {actionModal === 'deny' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Denial Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter the reason for denial..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setActionModal(null);
                  setSelectedClaim(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle action
                  setActionModal(null);
                  setSelectedClaim(null);
                  fetchClaims();
                }}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-colors ${
                  actionModal === 'approve' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionModal === 'approve' ? 'Approve' : 'Deny'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaimsProcessing;

