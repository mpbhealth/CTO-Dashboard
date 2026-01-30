import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Mail,
  UserCircle,
  Download,
  Users,
} from 'lucide-react';
import type { MemberWithAdvisor, MemberStatus } from '../../../types/commandCenter';

interface MemberTableProps {
  members: MemberWithAdvisor[];
  totalCount: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  selectedIds: string[];
  loading?: boolean;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onSelectionChange: (ids: string[]) => void;
  onMemberClick?: (member: MemberWithAdvisor) => void;
  onExportSelected?: () => void;
}

const statusColors: Record<MemberStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  suspended: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
};

export default function MemberTable({
  members,
  totalCount,
  page,
  pageSize,
  sortBy,
  sortOrder,
  selectedIds,
  loading = false,
  onSort,
  onPageChange,
  onSelectionChange,
  onMemberClick,
  onExportSelected,
}: MemberTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  const allSelected = members.length > 0 && members.every((m) => selectedIds.includes(m.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(members.map((m) => m.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <ChevronUp className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-cyan-500" />
    ) : (
      <ChevronDown className="w-4 h-4 text-cyan-500" />
    );
  };

  const columns = [
    { key: 'full_name', label: 'Member', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'plan_name', label: 'Plan', sortable: true },
    { key: 'assigned_advisor_name', label: 'Advisor', sortable: true },
    { key: 'enrollment_date', label: 'Enrolled', sortable: true },
    { key: 'actions', label: '', sortable: false },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-cyan-50 border-b border-cyan-100 px-6 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-700 font-medium">
                {selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={onExportSelected}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-cyan-700 bg-white rounded-lg border border-cyan-200 hover:bg-cyan-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Selected
                </button>
                <button
                  onClick={() => onSelectionChange([])}
                  className="text-sm text-cyan-600 hover:text-cyan-800"
                >
                  Clear selection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => el && (el.indeterminate = someSelected)}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider group ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon column={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-gray-200 rounded" />
                        <div className="w-24 h-3 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-16 h-6 bg-gray-200 rounded-full" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-8 h-8 bg-gray-200 rounded" />
                  </td>
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No members found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Try adjusting your filters or import new members
                  </p>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onMouseEnter={() => setHoveredRow(member.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onMemberClick?.(member)}
                  className={`transition-colors ${
                    selectedIds.includes(member.id)
                      ? 'bg-cyan-50'
                      : hoveredRow === member.id
                      ? 'bg-gray-50'
                      : 'bg-white'
                  } ${onMemberClick ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(member.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectOne(member.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white font-semibold">
                        {member.first_name?.[0]}
                        {member.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          {member.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusColors[member.status]?.bg || 'bg-gray-100'
                      } ${statusColors[member.status]?.text || 'text-gray-700'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          statusColors[member.status]?.dot || 'bg-gray-500'
                        }`}
                      />
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-700">{member.plan_name || '-'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {member.assigned_advisor_name || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500">
                      {member.enrollment_date
                        ? new Date(member.enrollment_date).toLocaleDateString()
                        : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{startIndex}</span> to{' '}
          <span className="font-medium">{endIndex}</span> of{' '}
          <span className="font-medium">{totalCount}</span> members
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
