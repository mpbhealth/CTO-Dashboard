import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown, Users, RotateCcw } from 'lucide-react';
import type { MemberFilters as MemberFiltersType, MemberStatus, PlanType } from '../../../types/commandCenter';

interface MemberFiltersProps {
  filters: MemberFiltersType;
  onFiltersChange: (filters: MemberFiltersType) => void;
  totalCount: number;
  filteredCount: number;
}

const statusOptions: { value: MemberStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'suspended', label: 'Suspended' },
];

const planOptions: { value: PlanType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Plans' },
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
];

export default function MemberFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: MemberFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStatusChange = (status: MemberStatus | 'all') => {
    onFiltersChange({ ...filters, status });
  };

  const handlePlanChange = (plan_type: PlanType | 'all') => {
    onFiltersChange({ ...filters, plan_type });
  };

  const handleIncludeDownlineChange = (include_downline: boolean) => {
    onFiltersChange({ ...filters, include_downline });
  };

  const handleDateFromChange = (enrollment_date_from: string) => {
    onFiltersChange({ ...filters, enrollment_date_from });
  };

  const handleDateToChange = (enrollment_date_to: string) => {
    onFiltersChange({ ...filters, enrollment_date_to });
  };

  const handleReset = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      plan_type: 'all',
      include_downline: true,
      enrollment_date_from: undefined,
      enrollment_date_to: undefined,
    });
  };

  const hasActiveFilters =
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    (filters.plan_type && filters.plan_type !== 'all') ||
    filters.enrollment_date_from ||
    filters.enrollment_date_to;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 space-y-4">
      {/* Main filters row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[280px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members by name, email, or ID..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all text-sm"
            />
            {filters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleStatusChange(e.target.value as MemberStatus | 'all')}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all text-sm bg-white cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Plan dropdown */}
        <div className="relative">
          <select
            value={filters.plan_type || 'all'}
            onChange={(e) => handlePlanChange(e.target.value as PlanType | 'all')}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all text-sm bg-white cursor-pointer"
          >
            {planOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Include Downline Toggle */}
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={filters.include_downline ?? true}
            onChange={(e) => handleIncludeDownlineChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
          />
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Include Downline</span>
        </label>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors text-sm font-medium ${
            showAdvanced
              ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Advanced
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {/* Advanced filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date range filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enrolled From
                </label>
                <input
                  type="date"
                  value={filters.enrollment_date_from || ''}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enrolled To
                </label>
                <input
                  type="date"
                  value={filters.enrollment_date_to || ''}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all text-sm"
                />
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-500">
                  Filter by enrollment date range to narrow down your search results.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Showing{' '}
          <span className="font-semibold text-gray-700">{filteredCount.toLocaleString()}</span>{' '}
          {hasActiveFilters && (
            <>
              of <span className="font-semibold text-gray-700">{totalCount.toLocaleString()}</span>
            </>
          )}{' '}
          members
        </span>
        {hasActiveFilters && (
          <span className="text-cyan-600 font-medium">
            {Math.round((filteredCount / totalCount) * 100)}% match filters
          </span>
        )}
      </div>
    </div>
  );
}
