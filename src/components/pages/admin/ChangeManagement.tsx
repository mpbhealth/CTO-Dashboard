/**
 * Change Management
 * 
 * Change request tracking with approval workflow for SOC 2 Type II compliance.
 * Tracks system changes, approvals, and provides audit trail.
 */

import { useState, useEffect } from 'react';
import {
  GitBranch,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Calendar,
  MessageSquare,
  Shield,
  Rocket,
  Undo2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { logAdminAction } from '../../../lib/auditService';

// Types
type ChangeStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'implemented' | 'rolled_back';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  requester_id: string;
  requester_name: string;
  approver_id?: string;
  approver_name?: string;
  status: ChangeStatus;
  risk_level: RiskLevel;
  category: string;
  affected_systems: string[];
  implementation_date?: string;
  rollback_plan: string;
  testing_notes?: string;
  approval_date?: string;
  rejection_reason?: string;
  implementation_notes?: string;
  created_at: string;
  updated_at: string;
}

// Demo data
const demoChangeRequests: ChangeRequest[] = [
  {
    id: '1',
    title: 'Upgrade Supabase SDK to v2.45',
    description: 'Update the Supabase JavaScript SDK to the latest version for security patches and new features.',
    requester_id: 'u1',
    requester_name: 'CTO User',
    status: 'pending',
    risk_level: 'medium',
    category: 'Dependencies',
    affected_systems: ['Frontend', 'API'],
    rollback_plan: 'Revert package.json and package-lock.json to previous versions.',
    testing_notes: 'Run full test suite, verify auth flows, test real-time subscriptions.',
    created_at: '2026-01-28T10:00:00Z',
    updated_at: '2026-01-28T10:00:00Z',
  },
  {
    id: '2',
    title: 'Add PHI encryption to member profiles',
    description: 'Implement field-level encryption for PHI fields in member_profiles table to meet HIPAA requirements.',
    requester_id: 'u2',
    requester_name: 'Security Officer',
    approver_id: 'u1',
    approver_name: 'CTO User',
    status: 'approved',
    risk_level: 'high',
    category: 'Security',
    affected_systems: ['Database', 'API', 'Frontend'],
    implementation_date: '2026-02-01T00:00:00Z',
    rollback_plan: 'Maintain dual storage (encrypted/unencrypted) during transition. Can disable encryption flag to revert.',
    testing_notes: 'Test encryption/decryption performance. Verify no data loss. Load test with 10k records.',
    approval_date: '2026-01-29T14:30:00Z',
    created_at: '2026-01-25T09:00:00Z',
    updated_at: '2026-01-29T14:30:00Z',
  },
  {
    id: '3',
    title: 'Update RLS policies for compliance module',
    description: 'Refine row-level security policies to ensure proper access control for HIPAA compliance tables.',
    requester_id: 'u3',
    requester_name: 'HIPAA Officer',
    approver_id: 'u1',
    approver_name: 'CTO User',
    status: 'implemented',
    risk_level: 'high',
    category: 'Security',
    affected_systems: ['Database'],
    rollback_plan: 'Apply previous migration to revert RLS policies.',
    implementation_notes: 'Successfully deployed. All tests passing. Verified access controls working correctly.',
    approval_date: '2026-01-20T11:00:00Z',
    created_at: '2026-01-18T16:00:00Z',
    updated_at: '2026-01-22T10:30:00Z',
  },
  {
    id: '4',
    title: 'Add new marketing analytics dashboard',
    description: 'Create a new dashboard page for marketing metrics visualization.',
    requester_id: 'u4',
    requester_name: 'Marketing Manager',
    approver_id: 'u2',
    approver_name: 'Security Officer',
    status: 'rejected',
    risk_level: 'low',
    category: 'Feature',
    affected_systems: ['Frontend'],
    rollback_plan: 'Remove component and route.',
    rejection_reason: 'Requires additional security review for data access patterns. Please resubmit with data flow diagram.',
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-16T09:00:00Z',
  },
];

const statusColors: Record<ChangeStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  implemented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  rolled_back: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusIcons: Record<ChangeStatus, React.ElementType> = {
  draft: FileText,
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  implemented: Rocket,
  rolled_back: Undo2,
};

export function ChangeManagement() {
  const { profile } = useAuth();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChange, setExpandedChange] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filter, setFilter] = useState<ChangeStatus | 'all'>('all');

  // New change form state
  const [newChange, setNewChange] = useState({
    title: '',
    description: '',
    risk_level: 'medium' as RiskLevel,
    category: 'Feature',
    affected_systems: [] as string[],
    rollback_plan: '',
    testing_notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      setChanges(demoChangeRequests);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('change_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setChanges(data);
      }
    } catch (error) {
      console.error('Error loading change requests:', error);
      setChanges(demoChangeRequests);
    }

    setLoading(false);
  };

  const handleSubmitChange = async () => {
    if (!profile) return;

    const change: ChangeRequest = {
      id: `cr-${Date.now()}`,
      ...newChange,
      requester_id: profile.id,
      requester_name: profile.full_name || profile.email || 'Unknown',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setChanges(prev => [change, ...prev]);
    setShowNewForm(false);
    setNewChange({
      title: '',
      description: '',
      risk_level: 'medium',
      category: 'Feature',
      affected_systems: [],
      rollback_plan: '',
      testing_notes: '',
    });

    await logAdminAction(
      'Change request submitted',
      'system_config',
      change.id,
      { title: change.title, risk_level: change.risk_level }
    );
  };

  const handleApprove = async (changeId: string) => {
    if (!profile) return;

    setChanges(prev =>
      prev.map(c =>
        c.id === changeId
          ? {
              ...c,
              status: 'approved' as ChangeStatus,
              approver_id: profile.id,
              approver_name: profile.full_name || profile.email,
              approval_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

    await logAdminAction(
      'Change request approved',
      'system_config',
      changeId,
      { approver: profile.full_name || profile.email }
    );
  };

  const handleReject = async (changeId: string, reason: string) => {
    if (!profile) return;

    setChanges(prev =>
      prev.map(c =>
        c.id === changeId
          ? {
              ...c,
              status: 'rejected' as ChangeStatus,
              approver_id: profile.id,
              approver_name: profile.full_name || profile.email,
              rejection_reason: reason,
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

    await logAdminAction(
      'Change request rejected',
      'system_config',
      changeId,
      { approver: profile.full_name || profile.email, reason }
    );
  };

  const handleImplement = async (changeId: string, notes: string) => {
    setChanges(prev =>
      prev.map(c =>
        c.id === changeId
          ? {
              ...c,
              status: 'implemented' as ChangeStatus,
              implementation_notes: notes,
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

    await logAdminAction(
      'Change request implemented',
      'system_config',
      changeId,
      { notes }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredChanges = filter === 'all' 
    ? changes 
    : changes.filter(c => c.status === filter);

  if (loading) {
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
            <GitBranch className="w-7 h-7 text-blue-500" />
            Change Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and approve system changes for SOC 2 compliance
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Change Request
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected', 'implemented'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-1 opacity-70">
                ({changes.filter(c => c.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {changes.filter(c => c.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {changes.filter(c => c.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {changes.filter(c => c.status === 'implemented').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Implemented</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {changes.filter(c => c.risk_level === 'high' || c.risk_level === 'critical').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">High Risk</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change List */}
      <div className="space-y-4">
        {filteredChanges.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <GitBranch className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No change requests found</p>
          </div>
        ) : (
          filteredChanges.map(change => {
            const StatusIcon = statusIcons[change.status];
            return (
              <div
                key={change.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div
                  onClick={() => setExpandedChange(expandedChange === change.id ? null : change.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${statusColors[change.status]}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {change.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <User className="w-3 h-3" />
                          {change.requester_name}
                          <span className="mx-1">|</span>
                          <Calendar className="w-3 h-3" />
                          {formatDate(change.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${riskColors[change.risk_level]}`}>
                        {change.risk_level.toUpperCase()} RISK
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[change.status]}`}>
                        {change.status.toUpperCase().replace('_', ' ')}
                      </span>
                      {expandedChange === change.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedChange === change.id && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="py-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">{change.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">{change.category}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Affected Systems
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {change.affected_systems.map(system => (
                              <span
                                key={system}
                                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                              >
                                {system}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Rollback Plan
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">{change.rollback_plan}</p>
                      </div>

                      {change.testing_notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Testing Notes
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">{change.testing_notes}</p>
                        </div>
                      )}

                      {change.approver_name && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            {change.status === 'approved' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : change.status === 'rejected' ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : null}
                            <span className="text-gray-600 dark:text-gray-400">
                              {change.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {change.approver_name}
                              </span>
                              {change.approval_date && ` on ${formatDate(change.approval_date)}`}
                            </span>
                          </div>
                          {change.rejection_reason && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                              Reason: {change.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}

                      {change.implementation_notes && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Implementation Notes
                          </h4>
                          <p className="text-blue-600 dark:text-blue-400">{change.implementation_notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {change.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleApprove(change.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) handleReject(change.id, reason);
                            }}
                            className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}

                      {change.status === 'approved' && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              const notes = prompt('Enter implementation notes:');
                              if (notes) handleImplement(change.id, notes);
                            }}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <Rocket className="w-4 h-4" />
                            Mark as Implemented
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Change Request Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-blue-500" />
                New Change Request
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newChange.title}
                  onChange={(e) => setNewChange(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the change"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={newChange.description}
                  onChange={(e) => setNewChange(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed description of what will be changed and why"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="risk-level-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Risk Level *
                  </label>
                  <select
                    id="risk-level-select"
                    aria-label="Risk Level"
                    value={newChange.risk_level}
                    onChange={(e) => setNewChange(prev => ({ ...prev, risk_level: e.target.value as RiskLevel }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    id="category-select"
                    aria-label="Category"
                    value={newChange.category}
                    onChange={(e) => setNewChange(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Feature">Feature</option>
                    <option value="Security">Security</option>
                    <option value="Bug Fix">Bug Fix</option>
                    <option value="Dependencies">Dependencies</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Configuration">Configuration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Affected Systems
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Frontend', 'API', 'Database', 'Authentication', 'Storage', 'Edge Functions'].map(system => (
                    <button
                      key={system}
                      type="button"
                      onClick={() => {
                        setNewChange(prev => ({
                          ...prev,
                          affected_systems: prev.affected_systems.includes(system)
                            ? prev.affected_systems.filter(s => s !== system)
                            : [...prev.affected_systems, system],
                        }));
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        newChange.affected_systems.includes(system)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {system}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rollback Plan *
                </label>
                <textarea
                  value={newChange.rollback_plan}
                  onChange={(e) => setNewChange(prev => ({ ...prev, rollback_plan: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How to revert this change if something goes wrong"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Testing Notes
                </label>
                <textarea
                  value={newChange.testing_notes}
                  onChange={(e) => setNewChange(prev => ({ ...prev, testing_notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How this change should be tested"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <button
                onClick={() => setShowNewForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitChange}
                disabled={!newChange.title || !newChange.description || !newChange.rollback_plan}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChangeManagement;
