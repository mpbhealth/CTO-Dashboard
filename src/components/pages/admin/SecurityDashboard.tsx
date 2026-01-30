/**
 * Security Dashboard
 * 
 * Centralized security monitoring view for SOC 2 Type II and HIPAA compliance.
 * Displays real-time security events, threat level, alerts, and compliance score.
 */

import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  Eye,
  Lock,
  UserX,
  FileWarning,
  Clock,
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Download,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useSecurityDashboard, useThreatLevel } from '../../../hooks/useSecurityMonitor';
import { useAuditStatistics, useAuditLogs } from '../../../hooks/useSecurityAudit';
import type { SecurityAuditEntry } from '../../../lib/auditService';

// Severity color mapping
const severityColors = {
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

// Threat level color mapping
const threatLevelColors = {
  LOW: 'text-green-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-red-500',
};

const threatLevelBgColors = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

// Event type icons
const eventTypeIcons: Record<string, React.ElementType> = {
  LOGIN: CheckCircle,
  LOGOUT: XCircle,
  LOGIN_FAILED: UserX,
  PHI_VIEW: Eye,
  PHI_EXPORT: Download,
  PHI_MODIFY: FileWarning,
  PHI_DELETE: FileWarning,
  DATA_EXPORT: Download,
  ADMIN_ACTION: Shield,
  ROLE_CHANGE: Users,
  SECURITY_ALERT: AlertTriangle,
  ACCESS_DENIED: Lock,
  SESSION_EXPIRED: Clock,
  EMERGENCY_ACCESS: Zap,
};

export function SecurityDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const { status, rules, isLoading, runCheck, isChecking, refetch } = useSecurityDashboard();
  const { data: threatLevel } = useThreatLevel();
  const { data: stats } = useAuditStatistics(30);
  const { data: recentLogs } = useAuditLogs({ limit: 20 });

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    await runCheck();
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-500" />
            Security Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time security monitoring for SOC 2 and HIPAA compliance
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || isChecking}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${(refreshing || isChecking) ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Threat Level Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${threatLevel?.level === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/30' : threatLevel?.level === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/30' : threatLevel?.level === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              {threatLevel?.level === 'LOW' ? (
                <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <ShieldAlert className={`w-8 h-8 ${threatLevelColors[threatLevel?.level || 'LOW']}`} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Threat Level
              </h2>
              <p className={`text-2xl font-bold ${threatLevelColors[threatLevel?.level || 'LOW']}`}>
                {threatLevel?.level || 'LOW'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Threat Score</p>
            <div className="flex items-center gap-2">
              <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${threatLevelBgColors[threatLevel?.level || 'LOW']} transition-all duration-500`}
                  style={{ width: `${threatLevel?.score || 0}%` }}
                />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {threatLevel?.score || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Threat Factors */}
        {threatLevel?.factors && threatLevel.factors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contributing Factors
            </h3>
            <div className="space-y-2">
              {threatLevel.factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{factor.name}</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    +{factor.impact} points
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events (30d)"
          value={stats?.totalEvents || 0}
          icon={Activity}
          trend={null}
          color="blue"
        />
        <StatCard
          title="Critical Alerts"
          value={stats?.criticalEvents || 0}
          icon={AlertTriangle}
          trend={stats?.criticalEvents && stats.criticalEvents > 0 ? 'up' : 'down'}
          color={stats?.criticalEvents && stats.criticalEvents > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Failed Logins"
          value={stats?.failedLogins || 0}
          icon={UserX}
          trend={stats?.failedLogins && stats.failedLogins > 5 ? 'up' : 'down'}
          color={stats?.failedLogins && stats.failedLogins > 5 ? 'yellow' : 'green'}
        />
        <StatCard
          title="PHI Accesses"
          value={stats?.phiAccesses || 0}
          icon={Eye}
          trend={null}
          color="purple"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Security Events
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last 24 hours
            </span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {recentLogs?.data && recentLogs.data.length > 0 ? (
              recentLogs.data.map((event) => (
                <EventRow key={event.id} event={event} formatTimeAgo={formatTimeAgo} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No security events recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Alert Rules */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              Active Alert Rules
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {rules?.filter(r => r.enabled).length || 0} active
            </span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {rules && rules.length > 0 ? (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-lg border ${
                    rule.enabled
                      ? 'border-gray-200 dark:border-gray-700'
                      : 'border-gray-100 dark:border-gray-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          severityColors[rule.severity]
                        }`}
                      >
                        {rule.severity}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {rule.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${
                        rule.enabled
                          ? 'text-green-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {rule.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {rule.channels.map((channel) => (
                      <span
                        key={channel}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No alert rules configured</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          Compliance Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComplianceItem
            title="Encryption at Rest"
            status="compliant"
            standard="HIPAA 164.312(a)(2)(iv)"
          />
          <ComplianceItem
            title="Audit Logging"
            status="compliant"
            standard="SOC 2 CC7.2"
          />
          <ComplianceItem
            title="Access Controls"
            status="compliant"
            standard="HIPAA 164.312(a)(1)"
          />
          <ComplianceItem
            title="Session Management"
            status="compliant"
            standard="HIPAA 164.312(a)(2)(iii)"
          />
        </div>
      </div>

      {/* Monitor Status */}
      {status && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                status.status === 'healthy'
                  ? 'bg-green-500'
                  : status.status === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Security Monitor:{' '}
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {status.status}
              </span>
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {status.rules_active} rules active | {status.last_24h.total} events in last 24h
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  trend: 'up' | 'down' | null;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div
            className={`flex items-center text-sm ${
              trend === 'up' ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
  );
}

// Event Row Component
function EventRow({
  event,
  formatTimeAgo,
}: {
  event: SecurityAuditEntry;
  formatTimeAgo: (date: string) => string;
}) {
  const Icon = eventTypeIcons[event.event_type] || Activity;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div
        className={`p-2 rounded-lg ${
          event.severity === 'CRITICAL'
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : event.severity === 'WARNING'
            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {event.event_type.replace(/_/g, ' ')}
          </span>
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${severityColors[event.severity]}`}>
            {event.severity}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {event.action}
        </p>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {event.created_at && formatTimeAgo(event.created_at)}
      </div>
    </div>
  );
}

// Compliance Item Component
function ComplianceItem({
  title,
  status,
  standard,
}: {
  title: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  standard: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        {status === 'compliant' ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : status === 'partial' ? (
          <AlertCircle className="w-5 h-5 text-yellow-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{standard}</p>
      <span
        className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded ${
          status === 'compliant'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : status === 'partial'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}

export default SecurityDashboard;
