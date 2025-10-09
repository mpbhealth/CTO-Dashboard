import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Users,
  Shield,
  FileCheck,
  Clock,
  TrendingUp,
  Plus,
  Activity,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  useComplianceDashboard,
  useMyTasks,
  useAuditLog,
} from '../../hooks/useComplianceData';
import { TaskStatusChip, PriorityChip, SeverityChip } from '../compliance/ComplianceChips';
import type { KPIData } from '../../types/compliance';

interface ComplianceCommandCenterProps {
  onTabChange?: (tab: string) => void;
}

const ComplianceCommandCenter: React.FC<ComplianceCommandCenterProps> = ({ onTabChange }) => {
  const { data: stats, isLoading: statsLoading } = useComplianceDashboard();
  const { data: myTasks = [] } = useMyTasks();
  const { data: auditLog = [] } = useAuditLog();
  const [dateRange, setDateRange] = useState('30d');

  // KPI Cards
  const kpis: KPIData[] = [
    {
      label: 'Approved Policies',
      value: stats?.policies.approved || 0,
      status: 'success',
      trend: 'up',
      trendValue: '+2 this month',
    },
    {
      label: 'Policies In Review',
      value: stats?.policies.inReview || 0,
      status: 'info',
    },
    {
      label: 'Overdue Reviews',
      value: stats?.policies.overdue || 0,
      status: stats?.policies.overdue ? 'error' : 'success',
    },
    {
      label: 'Active BAAs',
      value: stats?.baas.active || 0,
      status: 'success',
    },
    {
      label: 'BAAs Expiring Soon',
      value: stats?.baas.expiringSoon || 0,
      status: stats?.baas.expiringSoon ? 'warning' : 'success',
    },
    {
      label: 'Open Incidents',
      value: stats?.incidents.open || 0,
      status: stats?.incidents.open ? 'warning' : 'success',
    },
    {
      label: 'Critical Incidents',
      value: stats?.incidents.bySeverity.critical || 0,
      status: stats?.incidents.bySeverity.critical ? 'error' : 'success',
    },
    {
      label: 'Training Completion',
      value: `${stats?.training.completionRate || 0}%`,
      status: (stats?.training.completionRate || 0) >= 80 ? 'success' : 'warning',
      trend: (stats?.training.completionRate || 0) >= 80 ? 'up' : 'down',
    },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusTextColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const quickActions = [
    {
      label: 'New Incident',
      icon: AlertTriangle,
      tab: 'compliance/incidents',
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      label: 'Log PHI Access',
      icon: Shield,
      tab: 'compliance/phi-minimum',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      label: 'Create Policy',
      icon: FileText,
      tab: 'compliance/administration',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      label: 'Upload Evidence',
      icon: FileCheck,
      tab: 'compliance/templates-tools',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      label: 'Record Training',
      icon: Users,
      tab: 'compliance/training',
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Compliance Command Center</h1>
            <p className="text-blue-100">HIPAA Compliance Management System</p>
          </div>
          <Shield className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border-2 ${getStatusColor(kpi.status)}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{kpi.label}</p>
                <p className={`text-2xl font-bold ${getStatusTextColor(kpi.status)}`}>
                  {kpi.value}
                </p>
                {kpi.trendValue && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center space-x-1">
                    {kpi.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-red-600 transform rotate-180" />
                    )}
                    <span>{kpi.trendValue}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onTabChange?.(action.tab)}
              className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center justify-center space-y-2 transition-all hover:scale-105`}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Queue */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>My Queue</span>
              <span className="text-sm text-gray-500">({myTasks.length})</span>
            </h2>
            <button
              onClick={() => onTabChange?.('compliance/tasks')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>

          {myTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>All caught up! No pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {myTasks.slice(0, 10).map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border-2 ${
                      isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                      {isOverdue && (
                        <span className="text-xs text-red-600 font-medium">OVERDUE</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <TaskStatusChip status={task.status} size="sm" />
                      <PriorityChip priority={task.priority} size="sm" />
                      {task.due_date && (
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Recent Activity</span>
            </h2>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          {auditLog.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLog.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.actor_email || 'System'}</span>{' '}
                      <span className="text-gray-600">{getActionLabel(log.action)}</span>
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {JSON.stringify(log.details).substring(0, 60)}...
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sections Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Compliance Sections
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Administration & Governance', tab: 'compliance/administration', icon: FileText },
            { name: 'Training & Awareness', tab: 'compliance/training', icon: Users },
            { name: 'PHI & Minimum Necessary', tab: 'compliance/phi-minimum', icon: Shield },
            { name: 'Technical Safeguards', tab: 'compliance/technical-safeguards', icon: Shield },
            { name: 'Business Associates', tab: 'compliance/baas', icon: FileCheck },
            { name: 'Incidents & Breaches', tab: 'compliance/incidents', icon: AlertTriangle },
            { name: 'Audits & Monitoring', tab: 'compliance/audits', icon: Activity },
            { name: 'Templates & Tools', tab: 'compliance/templates-tools', icon: FileText },
          ].map((section, idx) => (
            <button
              key={idx}
              onClick={() => onTabChange?.(section.tab)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
            >
              <section.icon className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600">
                {section.name}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceCommandCenter;

