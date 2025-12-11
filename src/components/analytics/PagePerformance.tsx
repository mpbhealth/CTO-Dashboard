import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Eye, 
  Target, 
  Clock,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { usePagePerformance, formatDuration } from '../../hooks/useWebsiteAnalytics';

interface Props {
  dateRange: string;
}

type SortField = 'views' | 'uniqueViews' | 'avgTime' | 'entries' | 'exits';
type SortDirection = 'asc' | 'desc';

export default function PagePerformance({ dateRange }: Props) {
  const { data, loading, error, refetch } = usePagePerformance(dateRange);
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Sort pages
  const sortedPages = [...data.pages].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return (aVal - bVal) * modifier;
  });

  const kpiCards = [
    {
      title: 'Total Pages',
      value: data.totalPages.toString(),
      subtitle: 'tracked pages',
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Views',
      value: data.totalViews >= 1000 
        ? `${(data.totalViews / 1000).toFixed(1)}K` 
        : data.totalViews.toString(),
      subtitle: '',
      icon: Eye,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Unique Views',
      value: data.uniqueViews.toString(),
      subtitle: 'unique page views',
      icon: Target,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Avg. Time',
      value: formatDuration(data.avgTimeOnPage),
      subtitle: 'per page',
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Page Performance</h2>
            <p className="text-sm text-slate-500">Analyze how each page is performing</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">{kpi.title}</span>
                <div className={`w-8 h-8 ${kpi.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
              </div>
              <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
              {kpi.subtitle && (
                <p className="text-sm text-slate-500 mt-1">{kpi.subtitle}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Page Analytics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Page Analytics</h3>
          </div>
          <span className="text-sm text-slate-500">{data.totalPages} pages tracked</span>
        </div>
        
        {sortedPages.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No page data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Page
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('views')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Views
                      <SortIcon field="views" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('uniqueViews')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Unique
                      <SortIcon field="uniqueViews" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('avgTime')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Avg. Time
                      <SortIcon field="avgTime" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('entries')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Entries
                      <SortIcon field="entries" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('exits')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Exits
                      <SortIcon field="exits" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPages.slice(0, 20).map((page, index) => (
                  <motion.tr
                    key={page.path}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.02 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-medium text-slate-600">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-xs" title={page.title}>
                            {page.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500 truncate max-w-xs">{page.path}</p>
                            <div className="w-full max-w-24 bg-slate-100 rounded-full h-1">
                              <div 
                                className="h-1 rounded-full bg-emerald-500"
                                style={{ width: `${Math.min((page.views / data.pages[0]?.views) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                      {page.views}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-600">
                      {page.uniqueViews}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-600">
                      {formatDuration(page.avgTime)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-600">
                      {page.entries}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-600">
                      {page.exits}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {page.isNew ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <Sparkles className="w-3 h-3" />
                          New
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
