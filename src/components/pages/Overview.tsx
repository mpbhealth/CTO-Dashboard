import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Calendar, Plus, CreditCard as Edit, Trash2, TrendingUp, TrendingDown, DollarSign, Shield, Activity, Briefcase, CheckCircle2, AlertTriangle, Server, Code, Target, Clock, FileText, BarChart3, PieChart, Zap, Package, GitBranch, Ticket } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

import KPICard from '../ui/KPICard';
import { useKPIData, useTeamMembers, useProjects } from '../../hooks/useSupabaseData';
import { useDepartments, useEmployeeProfiles, useDepartmentMetrics } from '../../hooks/useOrganizationalData';
import { useSaaSExpenses } from '../../hooks/useSaaSExpenses';
import { useTicketStats, useTicketTrends } from '../../hooks/useTickets';
import { useEnrollmentData } from '../../hooks/useEnrollmentData';
import { useAudits } from '../../hooks/useComplianceData';
import AddTeamMemberModal from '../modals/AddTeamMemberModal';
import EditTeamMemberModal from '../modals/EditTeamMemberModal';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

const COLORS = ['#06B6D4', '#EC4899', '#10B981', '#F59E0B', '#14B8A6', '#F97316', '#0EA5E9', '#F43F5E'];

export default function Overview() {
  const { data: kpiData = [], loading: kpiLoading, error: kpiError } = useKPIData();
  const { data: teamMembers = [], loading: teamLoading, error: teamError, refetch: refetchTeam } = useTeamMembers();
  const { data: departments = [], loading: deptLoading } = useDepartments();
  const { data: employees = [], loading: empLoading } = useEmployeeProfiles();
  const { data: departmentMetrics = [], loading: metricsLoading } = useDepartmentMetrics();
  const { data: projects = [], loading: projectsLoading } = useProjects();
  const { 
    data: saasExpenses = [], 
    metrics: saasMetrics = { totalMonthly: 0, totalAnnual: 0, totalTools: 0, totalDepartments: 0, renewingNext30Days: 0 }, 
    loading: saasLoading 
  } = useSaaSExpenses();
  const { data: enrollments = [], loading: enrollmentsLoading } = useEnrollmentData();
  const { data: audits = [], loading: auditsLoading } = useAudits();
  const { stats: ticketStats, loading: ticketStatsLoading } = useTicketStats();
  const { trends: ticketTrends, loading: ticketTrendsLoading } = useTicketTrends(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  const loading = kpiLoading || teamLoading || deptLoading || empLoading;
  const error = kpiError || teamError;

  // Calculate comprehensive metrics
  const orgMetrics = useMemo(() => {
    const activeDepts = departments.filter(d => d.is_active).length;
    const totalBudget = departments.reduce((sum, d) => sum + (d.budget_allocated || 0), 0);
    const totalHeadcount = departments.reduce((sum, d) => sum + (d.headcount || 0), 0);
    
    const activeProjects = projects.filter(p => p.status === 'Building').length;
    const completedProjects = projects.filter(p => p.status === 'Live').length;
    const projectsAtRisk = projects.filter(p => p.progress < 50).length;

    const activeEnrollments = enrollments.filter(e => e.enrollment_status === 'active').length;
    const totalRevenue = enrollments.reduce((sum, e) => sum + (e.premium_amount || 0), 0);

    const completedAudits = audits.filter(a => a.status === 'completed').length;
    const upcomingAudits = audits.filter(a => 
      a.status !== 'completed' && 
      a.period_start && 
      new Date(a.period_start) >= new Date()
    ).length;

    return {
      departments: activeDepts,
      totalBudget,
      totalHeadcount,
      activeProjects,
      completedProjects,
      projectsAtRisk,
      activeEnrollments,
      totalRevenue,
      monthlyRevenue: totalRevenue / 12,
      saasSpend: (saasMetrics?.totalMonthly ?? 0),
      saasTools: (saasMetrics?.totalTools ?? 0),
      completedAudits,
      upcomingAudits,
      teamMembers: teamMembers.length,
      employees: employees.length,
    };
  }, [departments, projects, enrollments, audits, teamMembers, employees, saasMetrics]);

  // Department distribution for pie chart
  const departmentDistribution = useMemo(() => {
    const deptStats = departments.reduce((acc, dept) => {
      if (dept.is_active) {
        acc.push({
          name: dept.name,
          value: dept.headcount || 0,
          budget: dept.budget_allocated || 0,
        });
      }
      return acc;
    }, [] as Array<{ name: string; value: number; budget: number }>);
    return deptStats.sort((a, b) => b.value - a.value);
  }, [departments]);

  // Budget allocation by department
  const budgetAllocation = useMemo(() => {
    return departments
      .filter(d => d.is_active && d.budget_allocated)
      .sort((a, b) => (b.budget_allocated || 0) - (a.budget_allocated || 0))
      .slice(0, 8)
      .map(d => ({
        name: d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name,
        budget: d.budget_allocated || 0,
        headcount: d.headcount || 0,
      }));
  }, [departments]);

  // Monthly trend data (mock - would be calculated from historical data)
  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    return months.map((month, idx) => ({
      month,
      projects: Math.floor(15 + Math.random() * 10 + idx * 2),
      revenue: Math.floor(400000 + Math.random() * 100000 + idx * 50000),
      employees: Math.floor(80 + idx * 5),
      saasSpend: Math.floor(50000 + Math.random() * 20000),
    }));
  }, []);

  // Project status distribution
  const projectStatusData = useMemo(() => {
    const statusCount = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-pink-600"></div>
          <p className="text-slate-600 font-medium">Loading company insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4 text-lg font-semibold">Error loading data: {error}</p>
          <p className="text-slate-600">Please make sure you're connected to Supabase.</p>
        </div>
      </div>
    );
  }

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (window.confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', member.id);

        if (error) throw error;
        refetchTeam();
      } catch (err) {
        console.error('Error deleting team member:', err);
        alert('Failed to delete team member. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500';
      case 'In Meeting':
        return 'bg-amber-500';
      case 'Focus Time':
        return 'bg-red-500';
      case 'Away':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'Live':
        return 'text-emerald-600 bg-emerald-50';
      case 'Building':
        return 'text-pink-600 bg-pink-50';
      case 'Planning':
        return 'text-purple-600 bg-purple-50';
      case 'On Hold':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="w-full h-full p-4 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Company Overview</h1>
            <p className="text-slate-600 mt-2 text-lg">
              High-level metrics and organizational insights for MPB Health
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              aria-label="Select time range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-slate-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
              title="Refresh data"
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Executive Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">{orgMetrics.departments}</span>
          </div>
          <h3 className="text-lg font-semibold">Active Departments</h3>
          <p className="text-sky-100 text-sm mt-1">{orgMetrics.totalHeadcount} total employees</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">
              ${(orgMetrics.monthlyRevenue / 1000).toFixed(0)}K
            </span>
          </div>
          <h3 className="text-lg font-semibold">Monthly Revenue</h3>
          <p className="text-emerald-100 text-sm mt-1">{orgMetrics.activeEnrollments} active enrollments</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-700 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Briefcase className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">{orgMetrics.activeProjects}</span>
          </div>
          <h3 className="text-lg font-semibold">Active Projects</h3>
          <p className="text-pink-100 text-sm mt-1">{orgMetrics.completedProjects} completed</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">{orgMetrics.completedAudits}</span>
          </div>
          <h3 className="text-lg font-semibold">Security Audits</h3>
          <p className="text-amber-100 text-sm mt-1">{orgMetrics.upcomingAudits} upcoming</p>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-pink-600" />
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => (
            <KPICard key={kpi.id} data={kpi} />
          ))}
        </div>
      </motion.div>

      {/* IT Support Tickets Section */}
      {ticketStats && !ticketStatsLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
            <Ticket className="w-6 h-6 mr-2 text-pink-600" />
            IT Support Tickets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-pink-600 mt-1">
                    {ticketStats?.open_tickets ?? 0}
                  </p>
                </div>
                <Ticket className="w-8 h-8 text-pink-400" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {ticketStats?.in_progress_tickets ?? 0} in progress
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Avg Resolution</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {(ticketStats?.avg_resolution_time_hours ?? 0).toFixed(1)}h
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {ticketStats?.resolved_tickets ?? 0} resolved
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">SLA Compliance</p>
                  <p className="text-2xl font-bold text-teal-600 mt-1">
                    {(ticketStats?.sla_compliance_percentage ?? 0).toFixed(0)}%
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-teal-400" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Meeting service levels
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Critical Tickets</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {((ticketStats?.tickets_by_priority?.critical ?? 0) + (ticketStats?.tickets_by_priority?.urgent ?? 0))}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Requires immediate attention
              </p>
            </div>
          </div>

          {/* IT Support Growth Trends */}
          {!ticketTrendsLoading && ticketTrends.length > 0 && (
            <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ticket Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ticketTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="month"
                    stroke="#64748B"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Projects"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Employees"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Organization Growth Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-pink-600" />
              Growth Trends
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" style={{ fontSize: '12px' }} />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="projects"
                stroke="#06B6D4"
                fillOpacity={1}
                fill="url(#colorProjects)"
                name="Projects"
              />
              <Area
                type="monotone"
                dataKey="employees"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorEmployees)"
                name="Employees"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-pink-600" />
              Team Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RechartsPieChart>
              <Pie
                data={departmentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.length > 12 ? name.substring(0, 10) + '...' : name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Budget Allocation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-pink-600" />
              Budget Allocation by Department
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={budgetAllocation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={90}
                style={{ fontSize: '11px' }}
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="budget" fill="#06B6D4" name="Budget" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Project Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <GitBranch className="w-5 h-5 mr-2 text-pink-600" />
              Project Portfolio Status
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RechartsPieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Company Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Directory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-pink-600" />
              <h2 className="text-xl font-semibold text-slate-900">Team Directory</h2>
              <span className="bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-1 rounded-full">
                {teamMembers.length}
              </span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-2">
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No team members yet. Add your first member!</p>
              </div>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-pink-600">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{member.name}</p>
                      <p className="text-sm text-slate-600">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{member.team}</p>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></div>
                        <span className="text-xs text-slate-600">{member.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-1 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded transition-colors"
                        title="Edit team member"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete team member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Organization Departments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="w-5 h-5 text-pink-600" />
            <h2 className="text-xl font-semibold text-slate-900">Departments</h2>
            <span className="bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-1 rounded-full">
              {departments.filter(d => d.is_active).length}
            </span>
          </div>
          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-2">
            {departments.filter(d => d.is_active).length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No departments found</p>
              </div>
            ) : (
              departments
                .filter(d => d.is_active)
                .sort((a, b) => (b.headcount || 0) - (a.headcount || 0))
                .map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-pink-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                      {dept.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-1">{dept.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-xs text-slate-600">
                          <Users className="w-3 h-3" />
                          <span>{dept.headcount || 0} members</span>
                        </div>
                        {dept.budget_allocated && (
                          <div className="flex items-center space-x-1 text-xs text-slate-600">
                            <DollarSign className="w-3 h-3" />
                            <span>${(dept.budget_allocated / 1000).toFixed(0)}K</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {dept.budget_allocated && (
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-slate-900">
                          ${dept.budget_allocated.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-600">Annual Budget</div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Financial Overview & Technology Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Financial Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-pink-600" />
            <h2 className="text-xl font-semibold text-slate-900">Financial Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-emerald-700">
                  ${(orgMetrics.monthlyRevenue / 1000).toFixed(1)}K
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Monthly SaaS Spend</p>
                <p className="text-2xl font-bold text-amber-700">
                  ${(orgMetrics.saasSpend / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-slate-600 mt-1">{orgMetrics.saasTools} tools</p>
              </div>
              <Package className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Total Dept Budget</p>
                <p className="text-2xl font-bold text-pink-700">
                  ${(orgMetrics.totalBudget / 1000000).toFixed(2)}M
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-pink-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Budget Utilization</p>
                <p className="text-2xl font-bold text-slate-700">
                  {orgMetrics.totalBudget > 0
                    ? ((orgMetrics.saasSpend * 12 / orgMetrics.totalBudget) * 100).toFixed(1)
                    : '0'}%
                </p>
                <p className="text-xs text-slate-600 mt-1">SaaS as % of total</p>
              </div>
              <Target className="w-8 h-8 text-slate-600" />
            </div>
          </div>
        </motion.div>

        {/* Technology & Projects Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Code className="w-5 h-5 text-pink-600" />
            <h2 className="text-xl font-semibold text-slate-900">Technology Health</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Active Projects</p>
                <p className="text-2xl font-bold text-pink-700">{orgMetrics.activeProjects}</p>
                <p className="text-xs text-slate-600 mt-1">{orgMetrics.completedProjects} completed</p>
              </div>
              <Briefcase className="w-8 h-8 text-pink-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">SaaS Applications</p>
                <p className="text-2xl font-bold text-cyan-700">{orgMetrics.saasTools}</p>
                <p className="text-xs text-slate-600 mt-1">Technology stack</p>
              </div>
              <Server className="w-8 h-8 text-cyan-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Security Audits</p>
                <p className="text-2xl font-bold text-green-700">{orgMetrics.completedAudits}</p>
                <p className="text-xs text-slate-600 mt-1">{orgMetrics.upcomingAudits} scheduled</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Projects At Risk</p>
                <p className="text-2xl font-bold text-red-700">{orgMetrics.projectsAtRisk}</p>
                <p className="text-xs text-slate-600 mt-1">Below 50% progress</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Active Projects Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Briefcase className="w-5 h-5 text-pink-600" />
          <h2 className="text-xl font-semibold text-slate-900">Active Projects</h2>
          <span className="bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-1 rounded-full">
            {projects.length}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map((project) => (
            <div
              key={project.id}
              className="border border-slate-200 rounded-lg p-4 hover:border-pink-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="font-semibold text-slate-900 line-clamp-1 flex-1 min-w-0">{project.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${getProjectStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{project.description}</p>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 relative overflow-hidden">
                  <div
                    className="bg-pink-600 h-2 rounded-full transition-all absolute left-0 top-0"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-pink-600" />
          <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {[
            {
              time: '2 hours ago',
              event: `New project "${projects[0]?.name || 'Dashboard'}" updated`,
              type: 'project',
              icon: Briefcase,
            },
            {
              time: '4 hours ago',
              event: `Security audit ${orgMetrics.completedAudits > 0 ? 'completed' : 'scheduled'}`,
              type: 'security',
              icon: Shield,
            },
            {
              time: '6 hours ago',
              event: `${teamMembers.length} team members in directory`,
              type: 'team',
              icon: Users,
            },
            {
              time: '1 day ago',
              event: `${departments.filter(d => d.is_active).length} active departments`,
              type: 'organization',
              icon: Building2,
            },
            {
              time: '2 days ago',
              event: `${orgMetrics.saasTools} SaaS tools managed`,
              type: 'tech',
              icon: Package,
            },
          ].map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'project'
                      ? 'bg-pink-100 text-pink-600'
                      : activity.type === 'security'
                      ? 'bg-green-100 text-green-600'
                      : activity.type === 'team'
                      ? 'bg-sky-100 text-sky-600'
                      : activity.type === 'organization'
                      ? 'bg-pink-100 text-pink-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900 font-medium">{activity.event}</p>
                  <p className="text-xs text-slate-600">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Modals */}
      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetchTeam()}
      />

      <EditTeamMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => refetchTeam()}
        member={selectedMember}
      />
    </div>
  );
}
