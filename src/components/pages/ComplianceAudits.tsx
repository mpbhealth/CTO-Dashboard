import React, { useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Building2,
  Target,
  FileText,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  useAudits,
  useCreateAudit,
  useUpdateAudit,
} from '../../hooks/useComplianceData';
import type { AuditKind, AuditStatus, HIFAAudit } from '../../types/compliance';

type NewAuditForm = {
  title: string;
  kind: AuditKind;
  status: AuditStatus;
  period_start: string;
  period_end: string;
  auditor_name: string;
  auditor_org: string;
  description: string;
  findings_summary: string;
  report_url: string;
};

const auditKindOptions: AuditKind[] = [
  'internal',
  'external',
  'vulnerability',
  'penetration',
  'risk-assessment',
];

const auditStatusOptions: AuditStatus[] = [
  'planned',
  'in-progress',
  'completed',
  'archived',
];

const buildDefaultForm = (): NewAuditForm => {
  const today = new Date().toISOString().split('T')[0];
  return {
    title: '',
    kind: 'internal',
    status: 'planned',
    period_start: today,
    period_end: today,
    auditor_name: '',
    auditor_org: '',
    description: '',
    findings_summary: '',
    report_url: '',
  };
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const ComplianceAudits: React.FC = () => {
  const { data: audits = [], isLoading } = useAudits();
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AuditStatus>('all');
  const [kindFilter, setKindFilter] = useState<'all' | AuditKind>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAudit, setNewAudit] = useState<NewAuditForm>(buildDefaultForm());

  const filteredAudits = useMemo(() => {
    return audits.filter((audit) => {
      const matchesSearch =
        audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.auditor_org?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.auditor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.kind.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ? true : audit.status === statusFilter;

      const matchesKind =
        kindFilter === 'all' ? true : audit.kind === kindFilter;

      return matchesSearch && matchesStatus && matchesKind;
    });
  }, [audits, searchTerm, statusFilter, kindFilter]);

  const upcomingAudits = useMemo(
    () =>
      audits.filter(
        (audit) =>
          audit.status !== 'completed' &&
          audit.period_start &&
          new Date(audit.period_start) >= new Date(),
      ),
    [audits],
  );

  const completedAudits = audits.filter((audit) => audit.status === 'completed');
  const findingsWithCAP = audits.filter(
    (audit) => audit.findings_summary && audit.cap_md,
  );

  const handleCreateAudit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createAudit.mutateAsync({
        title: newAudit.title,
        kind: newAudit.kind,
        status: newAudit.status,
        period_start: newAudit.period_start,
        period_end: newAudit.period_end,
        auditor_name: newAudit.auditor_name || null,
        auditor_org: newAudit.auditor_org || null,
        description: newAudit.description || null,
        findings_summary: newAudit.findings_summary || null,
        report_url: newAudit.report_url || null,
      } as Partial<HIFAAudit>);

      setShowCreateModal(false);
      setNewAudit(buildDefaultForm());
    } catch (error) {
      console.error('Failed to create audit:', error);
    }
  };

  const handleStatusChange = async (id: string, status: AuditStatus) => {
    try {
      await updateAudit.mutateAsync({
        id,
        updates: { status },
      });
    } catch (error) {
      console.error('Failed to update audit status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center space-x-2 text-2xl font-bold text-gray-900">
            <ClipboardCheck className="h-8 w-8 text-indigo-600" />
            <span>Audits & Monitoring</span>
          </h1>
          <p className="mt-1 text-gray-600">
            Plan, track, and document internal and external HIPAA audits.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          <span>Schedule Audit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border-2 border-indigo-200 bg-white p-4">
          <p className="text-sm text-gray-600">Upcoming Audits</p>
          <p className="text-2xl font-bold text-indigo-700">
            {upcomingAudits.length}
          </p>
        </div>
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <p className="text-sm text-gray-600">Completed This Year</p>
          <p className="text-2xl font-bold text-green-700">
            {
              completedAudits.filter((audit) => {
                const date = audit.period_end || audit.period_start;
                if (!date) return false;
                return new Date(date).getFullYear() === new Date().getFullYear();
              }).length
            }
          </p>
        </div>
        <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-gray-600">Active Engagements</p>
          <p className="text-2xl font-bold text-yellow-700">
            {audits.filter((audit) => audit.status === 'in-progress').length}
          </p>
        </div>
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
          <p className="text-sm text-gray-600">Findings with CAP</p>
          <p className="text-2xl font-bold text-purple-700">
            {findingsWithCAP.length}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search audits..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Status</span>
            </div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | AuditStatus)
              }
              aria-label="Filter by status"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All statuses</option>
              {auditStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            <select
              value={kindFilter}
              onChange={(event) =>
                setKindFilter(event.target.value as 'all' | AuditKind)
              }
              aria-label="Filter by audit type"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All types</option>
              {auditKindOptions.map((kind) => (
                <option key={kind} value={kind}>
                  {kind.replace(/-/g, ' ').replace(/\b\w/g, (c) =>
                    c.toUpperCase(),
                  )}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Audit Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Auditor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No audits found. Schedule your first assessment to get
                    started.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{audit.title}</p>
                        {audit.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {audit.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {audit.kind
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {audit.auditor_name || '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {audit.auditor_org || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{formatDate(audit.period_start)}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(audit.period_end)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={audit.status}
                        onChange={(event) =>
                          handleStatusChange(
                            audit.id,
                            event.target.value as AuditStatus,
                          )
                        }
                        aria-label={`Change status for ${audit.title}`}
                        className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium capitalize text-gray-700 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        {auditStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/-/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {audit.report_url && (
                          <a
                            href={audit.report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Report</span>
                          </a>
                        )}
                        {audit.cap_md && (
                          <span className="inline-flex items-center space-x-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>CAP</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center space-x-2 text-lg font-semibold text-gray-900">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <span>Audit Calendar</span>
          </h2>
          <ul className="space-y-3">
            {upcomingAudits.slice(0, 5).map((audit) => (
              <li
                key={audit.id}
                className="flex items-start justify-between rounded-lg border border-gray-200 p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{audit.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(audit.period_start)} &ndash;{' '}
                    {formatDate(audit.period_end)}
                  </p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  {audit.kind
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </li>
            ))}
            {upcomingAudits.length === 0 && (
              <li className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                No upcoming audits on the calendar.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center space-x-2 text-lg font-semibold text-gray-900">
            <Target className="h-5 w-5 text-indigo-600" />
            <span>Continuous Monitoring Checklist</span>
          </h2>
          <div className="space-y-3">
            {[
              {
                label: 'Weekly access review',
                status: 'In progress',
                icon: Building2,
              },
              {
                label: 'Quarterly vulnerability scan',
                status: 'Scheduled',
                icon: AlertTriangle,
              },
              {
                label: 'Annual risk assessment',
                status: 'Due Soon',
                icon: ClipboardCheck,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-indigo-50 p-2">
                      <Icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-indigo-700">
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Schedule New Audit
              </h2>
            </div>
            <form
              className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
              onSubmit={handleCreateAudit}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Audit Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAudit.title}
                    onChange={(event) =>
                      setNewAudit((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Annual HIPAA Security Risk Assessment"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Audit Type *
                  </label>
                  <select
                    value={newAudit.kind}
                    onChange={(event) =>
                      setNewAudit((prev) => ({
                        ...prev,
                        kind: event.target.value as AuditKind,
                      }))
                    }
                    aria-label="Audit Type"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {auditKindOptions.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind
                          .replace(/-/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status *
                  </label>
                  <select
                    value={newAudit.status}
                    onChange={(event) =>
                      setNewAudit((prev) => ({
                        ...prev,
                        status: event.target.value as AuditStatus,
                      }))
                    }
                    aria-label="Audit Status"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {auditStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status
                          .replace(/-/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Period Start
                  </label>
                  <input
                    type="date"
                    value={newAudit.period_start}
                    onChange={(event) =>
                      setNewAudit((prev) => ({
                        ...prev,
                        period_start: event.target.value,
                      }))
                    }
                    aria-label="Audit Period Start Date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Period End
                  </label>
                  <input
                    type="date"
                    value={newAudit.period_end}
                    onChange={(event) =>
                      setNewAudit((prev) => ({
                        ...prev,
                        period_end: event.target.value,
                      }))
                    }
                    aria-label="Audit Period End Date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Auditor Name
                  </label>
                  <input
                    type="text"
                    value={newAudit.auditor_name}
                    onChange={(event) =>
                      setNewAudit((prev) => ({
                        ...prev,
                        auditor_name: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Auditor Organization
                  </label>
                  <input
                    type="text"
                    value={newAudit.auditor_org}
                    onChange={(event) =>
                      setNewAudit((prev) => ({
                        ...prev,
                        auditor_org: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="MPB Compliance Team"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Summary / Scope
                </label>
                <textarea
                  value={newAudit.description}
                  onChange={(event) =>
                    setNewAudit((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Describe the scope of this audit engagement"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Findings Summary
                </label>
                <textarea
                  value={newAudit.findings_summary}
                  onChange={(event) =>
                    setNewAudit((prev) => ({
                      ...prev,
                      findings_summary: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Document key findings when available"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Report Link (optional)
                </label>
                <input
                  type="url"
                  value={newAudit.report_url}
                  onChange={(event) =>
                    setNewAudit((prev) => ({
                      ...prev,
                      report_url: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAudit(buildDefaultForm());
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAudit.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {createAudit.isPending ? 'Saving...' : 'Create Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceAudits;

