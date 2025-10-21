import { useState } from 'react';
import { RefreshCw, Plus, Filter, Search, Ticket, Clock, AlertCircle } from 'lucide-react';
import { useTickets, useTicketStats } from '../../hooks/useTickets';
import type { TicketFilters, TicketSortOptions, TicketStatus, TicketPriority } from '../../types/tickets';

export default function ITSupport() {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [sort, setSort] = useState<TicketSortOptions>({ field: 'created_at', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { tickets, loading, syncing, syncTickets, refresh } = useTickets(filters, sort);
  const { stats } = useTicketStats();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value || undefined }));
  };

  const handleStatusFilter = (status: TicketStatus) => {
    setFilters(prev => {
      const currentStatuses = prev.status || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status];
      return { ...prev, status: newStatuses.length > 0 ? newStatuses : undefined };
    });
  };

  const handlePriorityFilter = (priority: TicketPriority) => {
    setFilters(prev => {
      const currentPriorities = prev.priority || [];
      const newPriorities = currentPriorities.includes(priority)
        ? currentPriorities.filter(p => p !== priority)
        : [...currentPriorities, priority];
      return { ...prev, priority: newPriorities.length > 0 ? newPriorities : undefined };
    });
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-sky-600" />
            IT Support Tickets
          </h1>
          <p className="text-slate-600 mt-1">
            Manage and track support tickets from Championship IT
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => syncTickets()}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Tickets'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Tickets</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total_tickets}</p>
              </div>
              <Ticket className="w-8 h-8 text-slate-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Open Tickets</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.open_tickets}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Resolution</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.avg_resolution_time_hours.toFixed(1)}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">SLA Compliance</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.sla_compliance_percentage.toFixed(0)}%
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">✓</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search tickets by number, title, or description..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-sky-100 border-sky-300 text-sky-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['open', 'in_progress', 'pending', 'resolved', 'closed'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusFilter(status as TicketStatus)}
                      className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                        filters.status?.includes(status as TicketStatus)
                          ? getStatusColor(status as TicketStatus)
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {['low', 'medium', 'high', 'urgent', 'critical'].map(priority => (
                    <button
                      key={priority}
                      onClick={() => handlePriorityFilter(priority as TicketPriority)}
                      className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                        filters.priority?.includes(priority as TicketPriority)
                          ? getPriorityColor(priority as TicketPriority)
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
              <p className="text-slate-600 mt-2">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket className="w-16 h-16 text-slate-300 mx-auto" />
              <p className="text-slate-600 mt-4">No tickets found</p>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting your filters or create a new ticket
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {tickets.map(ticket => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {ticket.ticket_number}
                        </p>
                        <p className="text-sm text-slate-600 truncate max-w-md">
                          {ticket.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {ticket.assignee_name || 'Unassigned'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {ticket.category || 'Uncategorized'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{formatDate(ticket.created_at)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
