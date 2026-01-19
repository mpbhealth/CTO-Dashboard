import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { getImportHistory } from '../../../lib/memberIngestionService';
import type { MemberImportLog, ImportStatus } from '../../../types/commandCenter';

interface ImportHistoryProps {
  advisorId: string;
  refreshTrigger?: number;
}

const statusConfig: Record<
  ImportStatus,
  { icon: typeof CheckCircle; color: string; bgColor: string; label: string }
> = {
  pending: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    label: 'Pending',
  },
  processing: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    label: 'Processing',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'Failed',
  },
};

export default function ImportHistory({ advisorId, refreshTrigger }: ImportHistoryProps) {
  const [history, setHistory] = useState<MemberImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getImportHistory(advisorId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch import history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [advisorId, refreshTrigger]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Import History</h3>
            <p className="text-sm text-gray-500">Previous data imports and their status</p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-100">
        {loading && history.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-4" />
            <p className="text-gray-500">Loading import history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No imports yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Upload a CSV file to get started
            </p>
          </div>
        ) : (
          history.map((log, index) => {
            const status = statusConfig[log.status];
            const StatusIcon = status.icon;
            const isExpanded = expandedId === log.id;
            const successRate =
              log.total_rows > 0
                ? Math.round((log.successful_rows / log.total_rows) * 100)
                : 0;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Status icon */}
                    <div className={`p-2 rounded-lg ${status.bgColor}`}>
                      <StatusIcon
                        className={`w-5 h-5 ${status.color} ${
                          log.status === 'processing' ? 'animate-spin' : ''
                        }`}
                      />
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {log.file_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                        <span>{formatDate(log.created_at || '')}</span>
                        <span className="text-gray-300">|</span>
                        <span>{log.total_rows} rows</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-emerald-600">
                          {log.successful_rows}
                        </div>
                        <div className="text-xs text-gray-400">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-red-600">{log.failed_rows}</div>
                        <div className="text-xs text-gray-400">Failed</div>
                      </div>
                      <div className="w-16">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Rate</span>
                          <span className="font-medium text-gray-700">{successRate}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              successRate >= 90
                                ? 'bg-emerald-500'
                                : successRate >= 70
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expand button */}
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && log.error_details && log.error_details.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-4"
                  >
                    <div className="ml-14 p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-700">
                          Error Details ({log.error_details.length})
                        </span>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {log.error_details.map((error, i) => (
                          <div key={i} className="text-sm text-red-600 flex items-start gap-2">
                            <span className="font-mono text-xs bg-red-100 px-1.5 py-0.5 rounded">
                              Row {error.row}
                            </span>
                            <span>
                              {error.message}
                              {error.field && (
                                <span className="text-red-400"> ({error.field})</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
