import { useState } from 'react';
import { RefreshCw, Plus, Filter, Search, Ticket, Clock, AlertCircle, History, ChevronDown, ChevronUp, User, MessageSquare } from 'lucide-react';
import { useTickets, useTicketStats } from '../../hooks/useTickets';
import { useStaffLogs } from '../../hooks/useStaffLogs';
import type { TicketFilters, TicketSortOptions, TicketStatus, TicketPriority, StaffActionType } from '../../types/tickets';

export default function ITSupport() {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [sort, setSort] = useState<TicketSortOptions>({ field: 'created_at', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const { tickets, loading, syncing, syncTickets, refresh } = useTickets(filters, sort);
  const { stats } = useTicketStats();
  const { logs, loading: logsLoading, syncLogs } = useStaffLogs();

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
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
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

  const getActionTypeColor = (actionType: StaffActionType) => {
    switch (actionType) {
      case 'created':
        return 'bg-indigo-100 text-indigo-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'status_changed':
        return 'bg-yellow-100 text-yellow-800';
      case 'priority_changed':
        return 'bg-orange-100 text-orange-800';
      case 'commented':
        return 'bg-green-100 text-green-800';
      case 'resolved':
      case 'closed':
        return 'bg-emerald-100 text-emerald-800';
      case 'reopened':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (actionType: StaffActionType) => {
    switch (actionType) {
      case 'commented':
        return <MessageSquare className="w-4 h-4" />;
      case 'assigned':
      case 'transferred':
        return <User className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getTicketLogs = (ticketId: string) => {
    return logs.filter(log => log.ticket_id === ticketId);
  };

  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-indigo-600" />
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
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Tickets</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total_tickets}</p>
              </div>
              <Ticket className="w-8 h-8 text-slate-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Open Tickets</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.open_tickets}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-indigo-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Resolution</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.avg_resolution_time_hours?.toFixed(1) || '0.0'}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">SLA Compliance</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.sla_compliance_percentage?.toFixed(0) || '0'}%
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">✓</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
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
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
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
          ) : !tickets || tickets.length === 0 ? (
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
                {tickets.map(ticket => {
                  const ticketLogs = getTicketLogs(ticket.id);
                  const isExpanded = expandedTicket === ticket.id;

                  return (
                    <>
                      <tr
                        key={ticket.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleTicketExpansion(ticket.id)}
                              className="text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {ticket.ticket_number}
                              </p>
                              <p className="text-sm text-slate-600 truncate max-w-md">
                                {ticket.title}
                              </p>
                              {ticketLogs.length > 0 && (
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <History className="w-3 h-3" />
                                  {ticketLogs.length} staff {ticketLogs.length === 1 ? 'action' : 'actions'}
                                </p>
                              )}
                            </div>
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

                      {isExpanded && (
                        <tr key={`${ticket.id}-logs`} className="bg-slate-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="border-l-4 border-indigo-500 pl-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                  <History className="w-4 h-4 text-indigo-600" />
                                  Staff Activity Log
                                </h4>
                                {ticketLogs.length === 0 && !logsLoading && (
                                  <button
                                    onClick={() => syncLogs(ticket.id)}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Sync Logs
                                  </button>
                                )}
                              </div>

                              {logsLoading ? (
                                <div className="text-center py-4">
                                  <RefreshCw className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
                                  <p className="text-sm text-slate-600 mt-2">Loading activity...</p>
                                </div>
                              ) : ticketLogs.length === 0 ? (
                                <div className="text-center py-4">
                                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                                  <p className="text-sm text-slate-600 mt-2">No staff activity logged yet</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {ticketLogs.map(log => (
                                    <div
                                      key={log.id}
                                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${getActionTypeColor(log.action_type)}`}>
                                          {getActionIcon(log.action_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-slate-900">
                                              {log.staff_name}
                                            </span>
                                            <span
                                              className={`text-xs px-2 py-0.5 rounded-full ${getActionTypeColor(
                                                log.action_type
                                              )}`}
                                            >
                                              {log.action_type.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                              {formatDate(log.created_at)}
                                            </span>
                                          </div>

                                          {(log.previous_value || log.new_value) && (
                                            <div className="text-xs text-slate-600 mb-2">
                                              {log.previous_value && (
                                                <span className="line-through text-slate-500">
                                                  {log.previous_value}
                                                </span>
                                              )}
                                              {log.previous_value && log.new_value && (
                                                <span className="mx-2">→</span>
                                              )}
                                              {log.new_value && (
                                                <span className="font-medium text-slate-700">
                                                  {log.new_value}
                                                </span>
                                              )}
                                            </div>
                                          )}

                                          {log.comment && (
                                            <p className="text-sm text-slate-700 bg-slate-50 rounded p-2 mt-2">
                                              {log.comment}
                                            </p>
                                          )}

                                          {log.time_spent_minutes > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                                              <Clock className="w-3 h-3" />
                                              {log.time_spent_minutes} minutes logged
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
