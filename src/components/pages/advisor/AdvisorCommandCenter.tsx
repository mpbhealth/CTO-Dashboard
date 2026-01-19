import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  GitBranch,
  BarChart3,
  Upload,
  HelpCircle,
  Settings,
  RefreshCw,
} from 'lucide-react';
import {
  MemberTable,
  MemberFilters,
  HierarchyTree,
  CSVUploader,
  ImportHistory,
  CommandCenterKPIs,
  CommandCenterSecondaryStats,
} from '../../advisor/commandcenter';
import { buildAdvisorTree, getMembersForHierarchy } from '../../../lib/advisorHierarchyService';
import { getCommandCenterAnalytics } from '../../../lib/advisorAnalyticsService';
import type {
  CommandCenterTab,
  MemberFilters as MemberFiltersType,
  MemberWithAdvisor,
  AdvisorTreeNode,
  CommandCenterAnalytics,
  ImportResult,
  Member,
} from '../../../types/commandCenter';

// Analytics charts - reuse existing components
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface AdvisorCommandCenterProps {
  advisorId?: string;
  advisorName?: string;
}

const tabs: { id: CommandCenterTab; label: string; icon: typeof Users }[] = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'hierarchy', label: 'Hierarchy', icon: GitBranch },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'import', label: 'Import Data', icon: Upload },
];

export default function AdvisorCommandCenter({
  advisorId = 'adv-001',
  advisorName = 'John Smith',
}: AdvisorCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<CommandCenterTab>('members');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Member state
  const [members, setMembers] = useState<MemberWithAdvisor[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [memberPage, setMemberPage] = useState(1);
  const [memberFilters, setMemberFilters] = useState<MemberFiltersType>({
    search: '',
    status: 'all',
    plan_type: 'all',
    include_downline: true,
  });
  const [sortBy, setSortBy] = useState<keyof Member>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Hierarchy state
  const [hierarchyTree, setHierarchyTree] = useState<AdvisorTreeNode | null>(null);
  const [selectedHierarchyAdvisor, setSelectedHierarchyAdvisor] = useState<string | undefined>();

  // Analytics state
  const [analytics, setAnalytics] = useState<CommandCenterAnalytics | null>(null);

  // Import state
  const [importRefreshTrigger, setImportRefreshTrigger] = useState(0);

  const pageSize = 10;

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMembersForHierarchy(advisorId, {
        filters: {
          ...memberFilters,
          advisor_id: selectedHierarchyAdvisor,
        },
        page: memberPage,
        pageSize,
        sortBy,
        sortOrder,
      });
      setMembers(response.data);
      setMemberCount(response.count);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }, [advisorId, memberFilters, memberPage, sortBy, sortOrder, selectedHierarchyAdvisor]);

  // Fetch hierarchy
  const fetchHierarchy = useCallback(async () => {
    try {
      const response = await buildAdvisorTree(advisorId);
      setHierarchyTree(response.tree);
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error);
    }
  }, [advisorId]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await getCommandCenterAnalytics(advisorId, memberFilters.include_downline);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, [advisorId, memberFilters.include_downline]);

  // Initial load
  useEffect(() => {
    Promise.all([fetchMembers(), fetchHierarchy(), fetchAnalytics()]).finally(() =>
      setLoading(false)
    );
  }, []);

  // Refetch members when filters change
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMembers(), fetchHierarchy(), fetchAnalytics()]);
    setRefreshing(false);
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column as keyof Member);
      setSortOrder('asc');
    }
    setMemberPage(1);
  };

  // Handle hierarchy advisor selection
  const handleHierarchyAdvisorSelect = (advisorId: string, advisorName: string) => {
    setSelectedHierarchyAdvisor(
      selectedHierarchyAdvisor === advisorId ? undefined : advisorId
    );
    setMemberPage(1);
    setActiveTab('members');
  };

  // Handle import complete
  const handleImportComplete = (result: ImportResult) => {
    setImportRefreshTrigger((prev) => prev + 1);
    if (result.successCount > 0) {
      fetchMembers();
      fetchAnalytics();
    }
  };

  // Handle export selected
  const handleExportSelected = () => {
    const selectedMembers = members.filter((m) => selectedMemberIds.includes(m.id));
    const csv = [
      ['First Name', 'Last Name', 'Email', 'Status', 'Plan', 'Advisor', 'Enrolled'],
      ...selectedMembers.map((m) => [
        m.first_name,
        m.last_name,
        m.email || '',
        m.status,
        m.plan_name || '',
        m.assigned_advisor_name || '',
        m.enrollment_date || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
              <p className="text-gray-500 mt-1">
                Welcome back, {advisorName}! Managing{' '}
                <span className="font-semibold text-cyan-600">
                  {analytics?.portfolio_stats.total_members || 0}
                </span>{' '}
                members
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        {analytics && (
          <CommandCenterKPIs stats={analytics.portfolio_stats} loading={loading && !analytics} />
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-cyan-500 text-cyan-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    {tab.id === 'members' && memberCount > 0 && (
                      <span
                        className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                          isActive ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {memberCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Members Tab */}
              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <MemberFilters
                    filters={memberFilters}
                    onFiltersChange={(filters) => {
                      setMemberFilters(filters);
                      setMemberPage(1);
                    }}
                    totalCount={analytics?.portfolio_stats.total_members || 0}
                    filteredCount={memberCount}
                  />
                  <MemberTable
                    members={members}
                    totalCount={memberCount}
                    page={memberPage}
                    pageSize={pageSize}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    selectedIds={selectedMemberIds}
                    loading={loading}
                    onSort={handleSort}
                    onPageChange={setMemberPage}
                    onSelectionChange={setSelectedMemberIds}
                    onExportSelected={handleExportSelected}
                  />
                </motion.div>
              )}

              {/* Hierarchy Tab */}
              {activeTab === 'hierarchy' && (
                <motion.div
                  key="hierarchy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {hierarchyTree && (
                    <HierarchyTree
                      tree={hierarchyTree}
                      onAdvisorSelect={handleHierarchyAdvisorSelect}
                      selectedAdvisorId={selectedHierarchyAdvisor}
                    />
                  )}
                </motion.div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && analytics && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <CommandCenterSecondaryStats stats={analytics.portfolio_stats} />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Member Growth Trend */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Member Growth Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.growth_trends}>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const [year, month] = value.split('-');
                              return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
                                month: 'short',
                              });
                            }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value: number) => [value.toLocaleString(), '']}
                            labelFormatter={(label) => {
                              const [year, month] = label.split('-');
                              return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                              });
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="total"
                            name="Total Members"
                            stroke="#0891B2"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="new_members"
                            name="New Members"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Status Distribution */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Status Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.status_distribution}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ status, percentage }) =>
                              `${status.charAt(0).toUpperCase() + status.slice(1)} (${percentage}%)`
                            }
                          >
                            {analytics.status_distribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Plan Distribution */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Plan Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.plan_distribution} layout="vertical">
                          <XAxis type="number" />
                          <YAxis
                            dataKey="plan_name"
                            type="category"
                            width={120}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Bar dataKey="count" name="Members" radius={[0, 4, 4, 0]}>
                            {analytics.plan_distribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Advisor Performance */}
                    {analytics.advisor_performance && analytics.advisor_performance.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Team Performance
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                  Advisor
                                </th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                                  Total
                                </th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                                  Active
                                </th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                                  Retention
                                </th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                                  New (MTD)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {analytics.advisor_performance.map((advisor) => (
                                <tr key={advisor.advisor_id} className="hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <div className="font-medium text-gray-900">
                                      {advisor.advisor_name}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right text-gray-700">
                                    {advisor.total_members}
                                  </td>
                                  <td className="py-3 px-4 text-right text-gray-700">
                                    {advisor.active_members}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span
                                      className={`font-medium ${
                                        advisor.retention_rate >= 90
                                          ? 'text-emerald-600'
                                          : advisor.retention_rate >= 75
                                          ? 'text-amber-600'
                                          : 'text-red-600'
                                      }`}
                                    >
                                      {advisor.retention_rate}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className="text-emerald-600 font-medium">
                                      +{advisor.new_this_month}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Import Tab */}
              {activeTab === 'import' && (
                <motion.div
                  key="import"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <CSVUploader advisorId={advisorId} onImportComplete={handleImportComplete} />
                  <ImportHistory advisorId={advisorId} refreshTrigger={importRefreshTrigger} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
