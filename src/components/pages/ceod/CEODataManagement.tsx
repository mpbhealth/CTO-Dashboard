import { useState, useMemo } from 'react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';
import { Database, Upload, FileSpreadsheet, RefreshCw, History, CheckCircle, AlertCircle, Link as LinkIcon, Copy, Filter, Calendar, Share2 } from 'lucide-react';
import { CEODataImporter } from '../../ui/CEODataImporter';
import { useCEODataImport } from '../../../hooks/useCEODataImport';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

interface DepartmentUpload {
  id: string;
  department: string;
  file_name: string;
  file_size: number;
  row_count: number;
  rows_imported: number;
  rows_failed: number;
  status: string;
  batch_id: string;
  created_at: string;
  uploaded_by: string;
  validation_errors: { errors?: string[] } | null;
}

export function CEODataManagement() {
  const [activeTab, setActiveTab] = useState<'import' | 'history' | 'uploads'>('import');
  const [selectedDataset, setSelectedDataset] = useState<'cancellations' | 'leads' | 'sales' | 'concierge'>('cancellations');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [uploadLinkCopied, setUploadLinkCopied] = useState(false);
  const { getImportHistory } = useCEODataImport();

  const { data: importHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['ceo-import-history'],
    queryFn: getImportHistory,
  });

  const { data: departmentUploads = [], refetch: refetchUploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ['department-uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as DepartmentUpload[];
    },
  });

  const datasets = [
    {
      id: 'cancellations' as const,
      name: 'Cancellation Reports',
      description: 'Member cancellation data with reasons and save attempts',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'leads' as const,
      name: 'Lead Reports',
      description: 'CRM lead pipeline data with sources and status',
      icon: FileSpreadsheet,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      id: 'sales' as const,
      name: 'Sales Reports',
      description: 'Sales order data with plans and revenue',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'concierge' as const,
      name: 'Concierge Reports',
      description: 'Member interaction and touchpoint data',
      icon: FileSpreadsheet,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const selectedDatasetInfo = datasets.find(d => d.id === selectedDataset);

  const filteredUploads = useMemo(() => {
    return departmentUploads.filter((upload) => {
      if (filterDepartment && upload.department !== filterDepartment) return false;
      if (filterStatus && upload.status !== filterStatus) return false;
      return true;
    });
  }, [departmentUploads, filterDepartment, filterStatus]);

  const uploadStats = useMemo(() => {
    const total = departmentUploads.length;
    const completed = departmentUploads.filter(u => u.status === 'completed').length;
    const failed = departmentUploads.filter(u => u.status === 'failed').length;
    const pending = departmentUploads.filter(u => u.status === 'processing' || u.status === 'pending').length;
    return { total, completed, failed, pending };
  }, [departmentUploads]);

  const handleImportComplete = () => {
    refetchHistory();
  };

  const handleCopyUploadLink = () => {
    const uploadUrl = `${window.location.origin}/ceod/upload`;
    navigator.clipboard.writeText(uploadUrl);
    setUploadLinkCopied(true);
    setTimeout(() => setUploadLinkCopied(false), 2000);
  };

  const handleApproveUpload = async (uploadId: string) => {
    const { error } = await supabase
      .from('department_uploads')
      .update({ status: 'approved' })
      .eq('id', uploadId);

    if (error) {
      alert('Failed to approve upload');
      return;
    }

    refetchUploads();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <CEODashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="text-[#1a3d97]" size={32} />
              Data Management Command Center
            </h1>
            <p className="text-gray-600 mt-1">Import, manage, and monitor all department data uploads</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}/public/upload`;
                navigator.clipboard.writeText(shareUrl);
                const originalText = uploadLinkCopied;
                setUploadLinkCopied(true);
                setTimeout(() => setUploadLinkCopied(false), 2000);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
            >
              {uploadLinkCopied ? <CheckCircle size={18} /> : <Share2 size={18} />}
              {uploadLinkCopied ? 'Copied!' : 'Share Upload Portal'}
            </button>
            <button
              onClick={handleCopyUploadLink}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
            >
              {uploadLinkCopied ? <CheckCircle size={18} /> : <Copy size={18} />}
              {uploadLinkCopied ? 'Copied!' : 'Upload Department Data'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="text-[#1a3d97]" size={20} />
              <span className="text-xs font-medium text-gray-500">TOTAL</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{uploadStats.total}</div>
            <div className="text-sm text-gray-500">All Uploads</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-xs font-medium text-gray-500">COMPLETED</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{uploadStats.completed}</div>
            <div className="text-sm text-gray-500">Successful</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-red-600" size={20} />
              <span className="text-xs font-medium text-gray-500">FAILED</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{uploadStats.failed}</div>
            <div className="text-sm text-gray-500">Errors</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="text-yellow-600" size={20} />
              <span className="text-xs font-medium text-gray-500">PENDING</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{uploadStats.pending}</div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'import'
                  ? 'border-[#1a3d97] text-[#1a3d97]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Import Data
            </button>
            <button
              onClick={() => setActiveTab('uploads')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'uploads'
                  ? 'border-[#1a3d97] text-[#1a3d97]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 inline mr-2" />
              Department Uploads
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-[#1a3d97] text-[#1a3d97]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              Import History
            </button>
          </nav>
        </div>

        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Dataset</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {datasets.map((dataset) => {
                  const Icon = dataset.icon;
                  return (
                    <button
                      key={dataset.id}
                      onClick={() => setSelectedDataset(dataset.id)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        selectedDataset === dataset.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${dataset.bgColor}`}>
                          <Icon className={`w-5 h-5 ${dataset.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{dataset.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDatasetInfo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${selectedDatasetInfo.bgColor}`}>
                    {(() => {
                      const Icon = selectedDatasetInfo.icon;
                      return <Icon className={`w-5 h-5 ${selectedDatasetInfo.color}`} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Import {selectedDatasetInfo.name}
                    </h2>
                    <p className="text-sm text-gray-600">{selectedDatasetInfo.description}</p>
                  </div>
                </div>

                <CEODataImporter
                  targetTable={selectedDataset}
                  onImportComplete={handleImportComplete}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={20} className="text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  >
                    <option value="">All Departments</option>
                    <option value="concierge">Concierge</option>
                    <option value="sales">Sales</option>
                    <option value="operations">Operations</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Department Uploads</h2>
                <button
                  onClick={() => refetchUploads()}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-[#1a3d97] hover:bg-pink-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              {uploadsLoading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Loading uploads...</p>
                </div>
              ) : filteredUploads.length === 0 ? (
                <div className="p-12 text-center">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No uploads found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Share the upload link with departments to get started
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">File Name</th>
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
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-block px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium capitalize">
                              {upload.department}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{upload.file_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(upload.file_size)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="text-green-600 font-medium">{upload.rows_imported}</span>
                            {upload.rows_failed > 0 && (
                              <span className="text-red-600 ml-1">/ {upload.rows_failed} failed</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                upload.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : upload.status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : upload.status === 'approved'
                                  ? 'bg-pink-100 text-pink-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {upload.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {upload.status === 'completed' && (
                              <button
                                onClick={() => handleApproveUpload(upload.id)}
                                className="text-[#1a3d97] hover:text-[#00A896] font-medium"
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Imports</h2>
              <button
                onClick={() => refetchHistory()}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-[#1a3d97] hover:bg-pink-50 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            {importHistory.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No import history yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Import data to see history here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {importHistory.map((record) => (
                  <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">
                            {record.source_table.replace('stg_raw_', '').replace(/_/g, ' ')}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Sheet: {record.sheet_name || 'Unknown'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{record.rows_imported} imported</span>
                          {record.rows_failed > 0 && (
                            <span className="text-red-600">{record.rows_failed} failed</span>
                          )}
                          <span>
                            {new Date(record.started_at).toLocaleDateString()} at{' '}
                            {new Date(record.started_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {record.error_message && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            {record.error_message}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Batch: {record.import_batch_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </CEODashboardLayout>
  );
}
