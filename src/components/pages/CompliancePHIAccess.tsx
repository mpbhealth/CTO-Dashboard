import React, { useState } from 'react';
import { Plus, Shield, Download, Filter } from 'lucide-react';
import { usePHIAccessLogs, useLogPHIAccess } from '../../hooks/useComplianceData';
import type { PHIAccessFormData, PurposeCategory } from '../../types/compliance';

const CompliancePHIAccess: React.FC = () => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const { data: accessLogs = [], isLoading } = usePHIAccessLogs(dateFilter);
  const logAccess = useLogPHIAccess();

  const [newLog, setNewLog] = useState<PHIAccessFormData>({
    subject: '',
    purpose: '',
    purpose_category: 'Treatment',
    details: '',
    system_source: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logAccess.mutateAsync(newLog);
      setShowLogModal(false);
      setNewLog({
        subject: '',
        purpose: '',
        purpose_category: 'Treatment',
        details: '',
        system_source: '',
      });
    } catch (error) {
      console.error('Failed to log access:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date/Time', 'Accessor', 'Subject', 'Purpose Category', 'Purpose', 'Details', 'System'];
    const rows = accessLogs.map(log => [
      new Date(log.occurred_at).toLocaleString(),
      log.accessor_name || 'N/A',
      log.subject,
      log.purpose_category || '',
      log.purpose,
      log.details || '',
      log.system_source || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phi_access_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categoryCounts = {
    Treatment: accessLogs.filter(l => l.purpose_category === 'Treatment').length,
    Payment: accessLogs.filter(l => l.purpose_category === 'Payment').length,
    Operations: accessLogs.filter(l => l.purpose_category === 'Operations').length,
    Other: accessLogs.filter(l => l.purpose_category === 'Other').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="w-8 h-8 text-green-600" />
            <span>PHI Access & Minimum Necessary</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Track and log all PHI access for compliance and audit purposes
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            <span>Log Access</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Access Logs</p>
          <p className="text-2xl font-bold text-gray-900">{accessLogs.length}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg border-2 border-indigo-200 p-4">
          <p className="text-sm text-gray-600">Treatment</p>
          <p className="text-2xl font-bold text-indigo-800">{categoryCounts.Treatment}</p>
        </div>
        <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
          <p className="text-sm text-gray-600">Payment</p>
          <p className="text-2xl font-bold text-green-800">{categoryCounts.Payment}</p>
        </div>
        <div className="bg-purple-50 rounded-lg border-2 border-purple-200 p-4">
          <p className="text-sm text-gray-600">Operations</p>
          <p className="text-2xl font-bold text-purple-800">{categoryCounts.Operations}</p>
        </div>
        <div className="bg-gray-50 rounded-lg border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600">Other</p>
          <p className="text-2xl font-bold text-gray-800">{categoryCounts.Other}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-900">Date Range Filter</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Access Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Accessor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Subject (Member/Patient)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Purpose Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  System
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accessLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No access logs found
                  </td>
                </tr>
              ) : (
                accessLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(log.occurred_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.accessor_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {log.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        log.purpose_category === 'Treatment' ? 'bg-indigo-100 text-indigo-800' :
                        log.purpose_category === 'Payment' ? 'bg-green-100 text-green-800' :
                        log.purpose_category === 'Operations' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.purpose_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.purpose}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.system_source || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Access Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Log PHI Access</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-800">
                  Log all access to Protected Health Information (PHI) to maintain compliance with HIPAA minimum necessary standards.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject (Member/Patient ID) *
                </label>
                <input
                  type="text"
                  required
                  value={newLog.subject}
                  onChange={(e) => setNewLog({ ...newLog, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Member ID, Patient ID, MRN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose Category *
                </label>
                <select
                  required
                  value={newLog.purpose_category}
                  onChange={(e) => setNewLog({ ...newLog, purpose_category: e.target.value as PurposeCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Treatment">Treatment</option>
                  <option value="Payment">Payment</option>
                  <option value="Operations">Operations</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose (Specific Justification) *
                </label>
                <input
                  type="text"
                  required
                  value={newLog.purpose}
                  onChange={(e) => setNewLog({ ...newLog, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Reviewing care plan, Processing claim, Quality assurance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System/Source
                </label>
                <input
                  type="text"
                  value={newLog.system_source}
                  onChange={(e) => setNewLog({ ...newLog, system_source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., EHR, Claims System, Portal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details
                </label>
                <textarea
                  value={newLog.details}
                  onChange={(e) => setNewLog({ ...newLog, details: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional context or notes"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logAccess.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                >
                  {logAccess.isPending ? 'Logging...' : 'Log Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompliancePHIAccess;

