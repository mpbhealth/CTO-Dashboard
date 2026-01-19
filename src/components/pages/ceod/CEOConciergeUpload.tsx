import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Info, Download } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  uploadConciergeFile,
  getConciergeUploadTemplates,
  getUploadHistory,
  type ConciergeSubdepartment,
  type UploadResult,
} from '../../../lib/conciergeUploadService';

interface Template {
  id: string;
  template_name: string;
  subdepartment: string;
  display_name: string;
  description: string;
  file_name_pattern: string;
  expected_columns: Record<string, unknown>;
  validation_rules: Record<string, unknown>;
  transformation_notes: string;
}

interface UploadHistoryItem {
  id: string;
  upload_batch_id: string;
  subdepartment: string;
  check_type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  affected_rows: number;
  details: string | null;
  created_at: string;
}

export function CEOConciergeUpload() {
  const { user, profile } = useAuth();
  const [selectedSubdepartment, setSelectedSubdepartment] = useState<ConciergeSubdepartment | ''>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);

  useEffect(() => {
    loadTemplates();
    loadUploadHistory();
  }, []);

  useEffect(() => {
    if (selectedSubdepartment) {
      const template = templates.find(t => t.subdepartment === selectedSubdepartment);
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedSubdepartment, templates]);

  async function loadTemplates() {
    const data = await getConciergeUploadTemplates();
    setTemplates(data);
  }

  async function loadUploadHistory() {
    const data = await getUploadHistory(undefined, 10);
    setUploadHistory(data);
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file || !selectedSubdepartment) {
      alert('Please select a report type and file to upload');
      return;
    }

    if (!user || !profile) {
      alert('Authentication required. Please refresh the page and log in again.');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const uploadResult = await uploadConciergeFile(file, {
        subdepartment: selectedSubdepartment,
        fileName: file.name,
        orgId: profile.org_id || undefined,
        uploadedBy: user.email || undefined,
      });

      setResult(uploadResult);

      if (uploadResult.success) {
        setFile(null);
        loadUploadHistory();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        rowsProcessed: 0,
        rowsSucceeded: 0,
        rowsFailed: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Unknown error occurred' }],
        warnings: [],
      });
    } finally {
      setUploading(false);
    }
  };

  const SUBDEPARTMENT_OPTIONS = [
    {
      value: 'weekly' as ConciergeSubdepartment,
      label: 'Weekly Performance Metrics',
      description: 'Team performance reports with agent metrics',
      icon: '📊',
    },
    {
      value: 'daily' as ConciergeSubdepartment,
      label: 'Daily Member Interactions',
      description: 'Member touchpoints and issue tracking',
      icon: '📝',
    },
    {
      value: 'after_hours' as ConciergeSubdepartment,
      label: 'After-Hours Calls',
      description: 'Emergency and after-hours call logs',
      icon: '🌙',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Concierge Data Upload</h1>
          <p className="text-slate-600">
            Upload concierge reports for analysis and tracking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Select Report Type</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {SUBDEPARTMENT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedSubdepartment(option.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedSubdepartment === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <div className="font-semibold text-slate-900 mb-1">{option.label}</div>
                    <div className="text-sm text-slate-600">{option.description}</div>
                  </button>
                ))}
              </div>

              {selectedTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">
                        {selectedTemplate.display_name}
                      </h3>
                      <p className="text-sm text-blue-800 mb-2">{selectedTemplate.description}</p>
                      <div className="text-xs text-blue-700">
                        <strong>File Pattern:</strong> {selectedTemplate.file_name_pattern}
                      </div>
                      {selectedTemplate.transformation_notes && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-700 cursor-pointer hover:text-blue-800">
                            View format details
                          </summary>
                          <p className="text-xs text-blue-700 mt-1 pl-4">
                            {selectedTemplate.transformation_notes}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-slate-400'
                } ${!selectedSubdepartment ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={!selectedSubdepartment}
                />

                <div className="text-center">
                  <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  {file ? (
                    <div>
                      <p className="text-lg font-semibold text-slate-900 mb-1">{file.name}</p>
                      <p className="text-sm text-slate-600">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold text-slate-900 mb-1">
                        Drop CSV file here or click to browse
                      </p>
                      <p className="text-sm text-slate-600">
                        {selectedSubdepartment
                          ? 'Select a CSV file to upload'
                          : 'Please select a report type first'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || !selectedSubdepartment || uploading}
                className={`w-full mt-6 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  file && selectedSubdepartment && !uploading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Upload className="w-5 h-5" />
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>

            {result && (
              <div
                className={`rounded-xl shadow-sm border p-6 ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold mb-2 ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {result.success ? 'Upload Successful' : 'Upload Failed'}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Rows Processed:</span> {result.rowsProcessed}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Rows Succeeded:</span>{' '}
                        <span className="text-green-700">{result.rowsSucceeded}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Rows Failed:</span>{' '}
                        <span className="text-red-700">{result.rowsFailed}</span>
                      </p>
                    </div>

                    {result.summary && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm font-medium mb-1">Summary:</p>
                        {result.summary.dateRange && (
                          <p className="text-sm">Date Range: {result.summary.dateRange}</p>
                        )}
                        {result.summary.agents && result.summary.agents.length > 0 && (
                          <p className="text-sm">
                            Agents: {result.summary.agents.join(', ')}
                          </p>
                        )}
                        {result.summary.totalInteractions !== undefined && (
                          <p className="text-sm">
                            Total Interactions: {result.summary.totalInteractions}
                          </p>
                        )}
                        {result.summary.totalCalls !== undefined && (
                          <p className="text-sm">Total Calls: {result.summary.totalCalls}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {result.warnings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <h4 className="font-semibold text-amber-900">
                        Warnings ({result.warnings.length})
                      </h4>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.warnings.slice(0, 10).map((warning, idx) => (
                        <p key={idx} className="text-sm text-amber-800">
                          Row {warning.row}: {warning.message}
                        </p>
                      ))}
                      {result.warnings.length > 10 && (
                        <p className="text-sm text-amber-700 italic">
                          ... and {result.warnings.length - 10} more warnings
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-red-900 mb-2">
                      Errors ({result.errors.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.errors.slice(0, 10).map((error, idx) => (
                        <p key={idx} className="text-sm text-red-800">
                          {error.row > 0 ? `Row ${error.row}: ` : ''}
                          {error.message}
                        </p>
                      ))}
                      {result.errors.length > 10 && (
                        <p className="text-sm text-red-700 italic">
                          ... and {result.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Uploads</h3>

              {uploadHistory.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-4">
                  No uploads yet
                </p>
              ) : (
                <div className="space-y-3">
                  {uploadHistory.map((upload) => (
                    <div
                      key={upload.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 capitalize">
                          {upload.subdepartment.replace('_', ' ')}
                        </span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-slate-600">{upload.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(upload.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Sample Files</h3>
              <p className="text-sm text-blue-800 mb-3">
                Download sample CSV files to test the upload system:
              </p>
              <div className="space-y-2">
                <a
                  href="/sample-uploads/concierge-report-sample.csv"
                  download
                  className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Concierge Report Sample
                </a>
                <a
                  href="/sample-uploads/cancelation-reports-sample.csv"
                  download
                  className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Cancelation Reports Sample
                </a>
                <a
                  href="/sample-uploads/leads-reports-sample.csv"
                  download
                  className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Leads Reports Sample
                </a>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Download a sample file above to test</li>
                <li>• Select the report type that matches your CSV file</li>
                <li>• Ensure your CSV follows the expected format</li>
                <li>• Check the format details for each report type</li>
                <li>• Files are validated before import</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
