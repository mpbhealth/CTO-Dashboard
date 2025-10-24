import { useState } from 'react';
import { FileText, Download, Filter } from 'lucide-react';
import { useCurrentProfile, useAuditLogs } from '../../../hooks/useDualDashboard';

export function AuditLogViewer() {
  const { data: profile } = useCurrentProfile();
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [limit, setLimit] = useState(50);

  const { data: logs = [] } = useAuditLogs({
    action: actionFilter === 'all' ? undefined : actionFilter,
    limit,
  });

  const canViewAudit = profile?.role === 'admin' || profile?.role === 'cto' || profile?.role === 'ceo';

  if (!canViewAudit) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-600">You don't have permission to view audit logs.</p>
      </div>
    );
  }

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Resource ID', 'Details'];
    const rows = logs.map(log => [
      new Date(log.created_at).toISOString(),
      log.actor_profile_id || 'System',
      log.action,
      log.resource_id || '',
      JSON.stringify(log.details || {}),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionTypes = ['all', 'create', 'update_visibility', 'grant_access', 'revoke_access', 'upload', 'download'];

  const Layout = profile?.role === 'ceo'
    ? require('../../layouts/CEODashboardLayout').CEODashboardLayout
    : require('../../layouts/CTODashboardLayout').CTODashboardLayout;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-600 mt-1">Comprehensive activity tracking and compliance reporting</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Action:</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {actionTypes.map(action => (
                    <option key={action} value={action}>
                      {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Show:</label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={25}>25 entries</option>
                  <option value={50}>50 entries</option>
                  <option value={100}>100 entries</option>
                  <option value={250}>250 entries</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-600">No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const actionColors: Record<string, string> = {
                      create: 'bg-green-100 text-green-700',
                      update_visibility: 'bg-blue-100 text-blue-700',
                      grant_access: 'bg-purple-100 text-purple-700',
                      revoke_access: 'bg-red-100 text-red-700',
                      upload: 'bg-indigo-100 text-indigo-700',
                      download: 'bg-yellow-100 text-yellow-700',
                    };

                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.actor_profile_id?.substring(0, 8) || 'System'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {log.resource_id ? log.resource_id.substring(0, 8) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.details ? (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-700">View</summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
