import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Users,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  membership_number: string;
  membership_status: 'active' | 'pending' | 'suspended' | 'cancelled';
  membership_start_date: string;
  plan_id: string;
  city: string;
  state: string;
  created_at: string;
}

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
};

// Demo data for when Supabase isn't configured
const demoMembers: Member[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    membership_number: 'MBR-2024-00001',
    membership_status: 'active',
    membership_start_date: '2024-01-15',
    plan_id: 'premium',
    city: 'Austin',
    state: 'TX',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 234-5678',
    membership_number: 'MBR-2024-00002',
    membership_status: 'active',
    membership_start_date: '2024-02-01',
    plan_id: 'basic',
    city: 'Dallas',
    state: 'TX',
    created_at: '2024-02-01T09:30:00Z',
  },
  {
    id: '3',
    first_name: 'Michael',
    last_name: 'Williams',
    email: 'mwilliams@email.com',
    phone: '(555) 345-6789',
    membership_number: 'MBR-2024-00003',
    membership_status: 'pending',
    membership_start_date: '2024-03-10',
    plan_id: 'family',
    city: 'Houston',
    state: 'TX',
    created_at: '2024-03-10T14:00:00Z',
  },
  {
    id: '4',
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@email.com',
    phone: '(555) 456-7890',
    membership_number: 'MBR-2024-00004',
    membership_status: 'suspended',
    membership_start_date: '2024-01-20',
    plan_id: 'premium',
    city: 'San Antonio',
    state: 'TX',
    created_at: '2024-01-20T11:15:00Z',
  },
  {
    id: '5',
    first_name: 'David',
    last_name: 'Brown',
    email: 'dbrown@email.com',
    phone: '(555) 567-8901',
    membership_number: 'MBR-2024-00005',
    membership_status: 'active',
    membership_start_date: '2024-02-15',
    plan_id: 'basic',
    city: 'Fort Worth',
    state: 'TX',
    created_at: '2024-02-15T08:45:00Z',
  },
];

export function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    
    if (!isSupabaseConfigured) {
      // Use demo data
      let filtered = [...demoMembers];
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(m => 
          m.first_name.toLowerCase().includes(search) ||
          m.last_name.toLowerCase().includes(search) ||
          m.membership_number.toLowerCase().includes(search) ||
          m.email.toLowerCase().includes(search) ||
          m.phone.includes(search)
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(m => m.membership_status === statusFilter);
      }
      
      setTotalCount(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setMembers(filtered.slice(start, start + pageSize));
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('member_profiles')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,membership_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('membership_status', statusFilter);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;

      setMembers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers(demoMembers);
      setTotalCount(demoMembers.length);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleExportCSV = () => {
    const headers = ['Name', 'Member Number', 'Email', 'Phone', 'Status', 'City', 'State', 'Start Date'];
    const rows = members.map(m => [
      `${m.first_name} ${m.last_name}`,
      m.membership_number,
      m.email,
      m.phone,
      m.membership_status,
      m.city,
      m.state,
      m.membership_start_date,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Member Management</h1>
          <p className="text-slate-500 mt-1">Manage member accounts and profiles</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-sm">
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, member number, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
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
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={fetchMembers}
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['all', 'active', 'pending', 'suspended'] as const).map((status) => {
          const count = status === 'all' 
            ? totalCount 
            : members.filter(m => m.membership_status === status).length;
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`
                p-4 rounded-xl border transition-all text-left
                ${statusFilter === status 
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }
              `}
            >
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-sm text-slate-500 capitalize">{status === 'all' ? 'Total Members' : status}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Member #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Member Since
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
                    <p className="text-slate-500 mt-2">Loading members...</p>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-slate-500 mt-2">No members found</p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {member.first_name[0]}{member.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {member.city}, {member.state}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-600">
                        {member.membership_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {member.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex px-2.5 py-1 text-xs font-semibold rounded-full capitalize
                        ${statusColors[member.membership_status]}
                      `}>
                        {member.membership_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(member.membership_start_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          title="More options"
                        >
                          <MoreHorizontal className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} members
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default MemberManagement;

