'use client';

import { motion } from 'framer-motion';
import { Ticket, Plus, Search, Filter, AlertCircle, Clock, CheckCircle } from 'lucide-react';

/**
 * IT Support Tickets
 * 
 * Placeholder page for the ticketing system
 */
export default function TicketsPage() {
  // Mock tickets
  const tickets = [
    { id: 'TKT-001', title: 'VPN Connection Issues', status: 'open', priority: 'high', created: '2h ago' },
    { id: 'TKT-002', title: 'Password Reset Request', status: 'in_progress', priority: 'medium', created: '4h ago' },
    { id: 'TKT-003', title: 'Software Installation', status: 'resolved', priority: 'low', created: '1d ago' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-space-grotesk)]">
                IT Support
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Manage support tickets
              </p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        className="mb-6 flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <Filter className="w-5 h-5 text-slate-500" />
          <span className="text-slate-700 dark:text-slate-200">Filters</span>
        </button>
      </motion.div>

      {/* Tickets List */}
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(ticket.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">
                        {ticket.id}
                      </span>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {ticket.title}
                      </h3>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {ticket.created}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                    ticket.priority
                  )}`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

