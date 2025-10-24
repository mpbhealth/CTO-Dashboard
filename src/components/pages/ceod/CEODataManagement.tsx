import { useState } from 'react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';
import { Database, Upload, FileSpreadsheet, RefreshCw, History, CheckCircle, AlertCircle } from 'lucide-react';
import { CEODataImporter } from '../../ui/CEODataImporter';
import { useCEODataImport } from '../../../hooks/useCEODataImport';
import { useQuery } from '@tanstack/react-query';

export function CEODataManagement() {
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [selectedDataset, setSelectedDataset] = useState<'cancellations' | 'leads' | 'sales' | 'concierge'>('cancellations');
  const { getImportHistory } = useCEODataImport();

  const { data: importHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['ceo-import-history'],
    queryFn: getImportHistory,
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
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

  const handleImportComplete = () => {
    refetchHistory();
  };

  return (
    <CEODashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Database className="w-7 h-7 text-blue-600" />
            <span>Data Management</span>
          </h1>
          <p className="text-gray-600 mt-1">Import and manage CEO dashboard data from Excel reports</p>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'import'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Import Data
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
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
                          ? 'border-blue-500 bg-blue-50'
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

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Imports</h2>
              <button
                onClick={() => refetchHistory()}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
