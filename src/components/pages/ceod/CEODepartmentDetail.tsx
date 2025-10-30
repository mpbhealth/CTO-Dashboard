import { useState, useMemo } from 'react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';
import { Filter, RefreshCw, Mail, MessageSquare, Download, CheckCircle, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { useDepartmentData } from '../../../hooks/useDepartmentData';
import { useDepartmentNotes } from '../../../hooks/useDepartmentNotes';
import { NotesPanel } from '../../ui/NotesPanel';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DepartmentDetailProps {
  department: 'concierge' | 'sales' | 'operations' | 'finance' | 'saudemax';
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  gradient: string;
}

export function CEODepartmentDetail({
  department,
  title,
  description,
  icon: Icon,
  color,
  gradient,
}: DepartmentDetailProps) {
  const { uploads, stats, isLoading, refetch, approveUpload } = useDepartmentData(department);
  const { notes, createNote, updateNote, deleteNote } = useDepartmentNotes(department);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const filteredUploads = useMemo(() => {
    let filtered = uploads;

    if (filterStatus) {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(u => new Date(u.created_at) >= cutoff);
    }

    return filtered;
  }, [uploads, filterStatus, dateRange]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayUploads = uploads.filter(u => u.created_at.startsWith(date));
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        uploads: dayUploads.length,
        success: dayUploads.filter(u => u.status === 'completed' || u.status === 'approved').length,
        failed: dayUploads.filter(u => u.status === 'failed').length,
      };
    });
  }, [uploads]);

  const handleEmailDepartment = () => {
    const subject = encodeURIComponent(`${title} Department Report`);
    const body = encodeURIComponent(`
Department: ${title}
Total Uploads: ${stats.totalUploads}
Completed: ${stats.completedUploads}
Failed: ${stats.failedUploads}
Success Rate: ${stats.successRate.toFixed(1)}%
Total Rows Imported: ${stats.totalRowsImported}

View detailed report: ${window.location.href}
    `);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareToTeams = async () => {
    alert('Microsoft Teams integration coming soon! This will post a summary to your configured Teams channel.');
  };

  const handleExportData = () => {
    const csv = [
      ['Date', 'File Name', 'Status', 'Rows Imported', 'Rows Failed'],
      ...filteredUploads.map(u => [
        new Date(u.created_at).toLocaleDateString(),
        u.file_name,
        u.status,
        u.rows_imported,
        u.rows_failed,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${department}-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const transformedNotes = useMemo(() => {
    return notes.map(note => ({
      id: note.id,
      content: note.note_content,
      created_at: note.created_at,
      updated_at: note.updated_at,
    }));
  }, [notes]);

  const handleAddNote = async (content: string) => {
    await createNote.mutateAsync({
      department,
      note_content: content,
    });
  };

  const handleUpdateNote = async (id: string, content: string) => {
    await updateNote.mutateAsync({
      id,
      note_content: content,
    });
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote.mutateAsync(id);
  };

  return (
    <CEODashboardLayout>
      <div className="w-full space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <Icon className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title} Department</h1>
                <p className="text-gray-600 mt-1">{description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEmailDepartment}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Email department summary"
            >
              <Mail size={18} />
              Email
            </button>
            <button
              onClick={handleShareToTeams}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Share to Microsoft Teams"
            >
              <MessageSquare size={18} />
              Teams
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className={color} size={20} />
              <span className="text-xs font-medium text-gray-500">TOTAL</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUploads}</div>
            <div className="text-sm text-gray-500">Uploads</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-xs font-medium text-gray-500">SUCCESS</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">{stats.completedUploads} completed</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-red-600" size={20} />
              <span className="text-xs font-medium text-gray-500">FAILED</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.failedUploads}</div>
            <div className="text-sm text-gray-500">Errors</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className={color} size={20} />
              <span className="text-xs font-medium text-gray-500">ROWS</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalRowsImported.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Imported</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Trends (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="uploads" stroke="#ec4899" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} name="Success" />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Completed', value: stats.completedUploads, fill: '#10b981' },
                { name: 'Failed', value: stats.failedUploads, fill: '#ef4444' },
                { name: 'Pending', value: stats.pendingUploads, fill: '#f59e0b' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upload History</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">All statuses</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                  <button
                    onClick={() => refetch()}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-600">Loading uploads...</p>
                </div>
              ) : filteredUploads.length === 0 ? (
                <div className="p-12 text-center">
                  <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No uploads found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">File</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rows</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUploads.map((upload) => (
                      <tr key={upload.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(upload.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {upload.file_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatFileSize(upload.file_size)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-green-600 font-medium">{upload.rows_imported}</span>
                          {upload.rows_failed > 0 && (
                            <span className="text-red-600 ml-1">/ {upload.rows_failed} failed</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              upload.status === 'completed' || upload.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : upload.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {upload.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {upload.status === 'completed' && (
                            <button
                              onClick={() => approveUpload.mutate(upload.id)}
                              className="text-pink-600 hover:text-pink-700 font-medium"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <NotesPanel
              notes={transformedNotes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              title={`${title} Notes`}
            />
          </div>
        </div>
      </div>
    </CEODashboardLayout>
  );
}
