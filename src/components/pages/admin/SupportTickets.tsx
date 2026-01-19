import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Clock,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Reply,
  Eye,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_member' | 'waiting_staff' | 'resolved' | 'closed';
  member_name: string;
  member_email: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
  waiting_member: { label: 'Awaiting Member', color: 'bg-amber-100 text-amber-700' },
  waiting_staff: { label: 'Awaiting Staff', color: 'bg-orange-100 text-orange-700' },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  urgent: { label: 'Critical', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

const categoryIcons: Record<string, string> = {
  billing: '💳',
  claims: '📋',
  coverage: '🛡️',
  technical: '🔧',
  urgent: '🚨',
  general: '💬',
};

// Demo data
const demoTickets: Ticket[] = [
  {
    id: '1',
    ticket_number: 'TKT-202412-00001',
    subject: 'Unable to access member portal',
    description: 'I am unable to log into my member portal. The page keeps showing an error.',
    category: 'technical',
    priority: 'high',
    status: 'open',
    member_name: 'John Smith',
    member_email: 'john.smith@email.com',
    assigned_to: null,
    created_at: '2024-12-05T09:30:00Z',
    updated_at: '2024-12-05T09:30:00Z',
  },
  {
    id: '2',
    ticket_number: 'TKT-202412-00002',
    subject: 'Question about claim status',
    description: 'I submitted a claim 2 weeks ago and haven\'t heard back yet.',
    category: 'claims',
    priority: 'normal',
    status: 'in_progress',
    member_name: 'Sarah Johnson',
    member_email: 'sarah.j@email.com',
    assigned_to: 'Admin User',
    created_at: '2024-12-04T14:15:00Z',
    updated_at: '2024-12-05T10:00:00Z',
  },
  {
    id: '3',
    ticket_number: 'TKT-202412-00003',
    subject: 'URGENT: Medical emergency - need immediate authorization',
    description: 'I am in the hospital and need immediate pre-authorization for emergency surgery.',
    category: 'urgent',
    priority: 'urgent',
    status: 'open',
    member_name: 'Michael Williams',
    member_email: 'mwilliams@email.com',
    assigned_to: null,
    created_at: '2024-12-05T11:00:00Z',
    updated_at: '2024-12-05T11:00:00Z',
  },
  {
    id: '4',
    ticket_number: 'TKT-202412-00004',
    subject: 'Billing question about monthly premium',
    description: 'My premium seems higher than expected this month. Can you explain?',
    category: 'billing',
    priority: 'low',
    status: 'waiting_member',
    member_name: 'Emily Davis',
    member_email: 'emily.davis@email.com',
    assigned_to: 'Admin User',
    created_at: '2024-12-03T16:45:00Z',
    updated_at: '2024-12-04T09:30:00Z',
  },
  {
    id: '5',
    ticket_number: 'TKT-202411-00089',
    subject: 'Request for coverage explanation',
    description: 'I need clarification on what is covered under my plan.',
    category: 'coverage',
    priority: 'normal',
    status: 'resolved',
    member_name: 'David Brown',
    member_email: 'dbrown@email.com',
    assigned_to: 'Admin User',
    created_at: '2024-11-28T10:00:00Z',
    updated_at: '2024-12-02T14:30:00Z',
  },
];

export function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchTickets = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      let filtered = [...demoTickets];

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(t =>
          t.ticket_number.toLowerCase().includes(search) ||
          t.subject.toLowerCase().includes(search) ||
          t.member_name.toLowerCase().includes(search) ||
          t.member_email.toLowerCase().includes(search)
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === statusFilter);
      }

      if (priorityFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === priorityFilter);
      }

      if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
      }

      setTotalCount(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setTickets(filtered.slice(start, start + pageSize));
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('support_tickets')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`ticket_number.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;

      setTickets(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets(demoTickets);
      setTotalCount(demoTickets.length);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, currentPage]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Stats
  const openCount = demoTickets.filter(t => t.status === 'open').length;
  const inProgressCount = demoTickets.filter(t => t.status === 'in_progress').length;
  const waitingCount = demoTickets.filter(t => t.status === 'waiting_member').length;
  const criticalCount = demoTickets.filter(t => t.priority === 'urgent').length;

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-slate-500 mt-1">Manage customer support requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{openCount}</p>
              <p className="text-sm text-blue-600">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{inProgressCount}</p>
              <p className="text-sm text-purple-600">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{waitingCount}</p>
              <p className="text-sm text-amber-600">Awaiting Response</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
              <p className="text-sm text-red-600">Critical</p>
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
              placeholder="Search tickets..."
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
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_member">Awaiting Member</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
            >
              <option value="all">All Categories</option>
              <option value="billing">Billing</option>
              <option value="claims">Claims</option>
              <option value="coverage">Coverage</option>
              <option value="technical">Technical</option>
              <option value="urgent">Urgent</option>
              <option value="general">General</option>
            </select>

            <button
              onClick={fetchTickets}
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
            <p className="text-slate-500 mt-2">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-500 mt-2">No tickets found</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            const priority = priorityConfig[ticket.priority];
            const categoryIcon = categoryIcons[ticket.category] || '💬';

            return (
              <div
                key={ticket.id}
                className={`
                  bg-white rounded-xl border border-slate-200 p-5
                  hover:shadow-md transition-shadow
                  ${ticket.priority === 'urgent' ? 'ring-2 ring-red-500/20' : ''}
                `}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{categoryIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-slate-500">
                            {ticket.ticket_number}
                          </span>
                          <span className={`
                            inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full
                            ${status.color}
                          `}>
                            {status.label}
                          </span>
                          <span className={`
                            inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full
                            ${priority.color}
                          `}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 line-clamp-1">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {ticket.member_name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {getTimeAgo(ticket.created_at)}
                      </div>
                      {ticket.assigned_to && (
                        <div className="flex items-center gap-1.5 text-primary-600">
                          <CheckCircle className="w-4 h-4" />
                          Assigned to {ticket.assigned_to}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm">
                      <Reply className="w-4 h-4" />
                      Reply
                    </button>
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
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} tickets
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
    </div>
  );
}

export default SupportTickets;

