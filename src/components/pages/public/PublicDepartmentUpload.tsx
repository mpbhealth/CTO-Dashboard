import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft, Download, Eye } from 'lucide-react';
import Papa from 'papaparse';

interface UploadProgress {
  status: 'idle' | 'validating' | 'uploading' | 'success' | 'error';
  message: string;
  rowsProcessed?: number;
  totalRows?: number;
  errors?: string[];
}

const DEPARTMENT_CONFIG = {
  concierge: {
    name: 'Concierge',
    color: 'teal',
    fields: [
      { key: 'occurred_at', label: 'Occurred Date', type: 'date', required: true },
      { key: 'member_id', label: 'Member ID', type: 'text', required: false },
      { key: 'agent_name', label: 'Agent Name', type: 'text', required: false },
      { key: 'channel', label: 'Channel', type: 'text', required: false },
      { key: 'result', label: 'Result', type: 'text', required: false },
      { key: 'duration_minutes', label: 'Duration (Minutes)', type: 'number', required: false },
      { key: 'notes', label: 'Notes', type: 'text', required: false },
    ],
    sampleData: 'occurred_at,member_id,agent_name,channel,result,duration_minutes,notes\n2024-01-15,M12345,John Smith,Phone,Resolved,15,Member called about billing\n2024-01-16,M12346,Jane Doe,Email,Pending,0,Follow-up required',
  },
  sales: {
    name: 'Sales',
    color: 'blue',
    fields: [
      { key: 'order_date', label: 'Order Date', type: 'date', required: true },
      { key: 'order_id', label: 'Order ID', type: 'text', required: false },
      { key: 'member_id', label: 'Member ID', type: 'text', required: false },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'plan', label: 'Plan', type: 'text', required: false },
      { key: 'rep', label: 'Sales Rep', type: 'text', required: false },
      { key: 'channel', label: 'Channel', type: 'text', required: false },
      { key: 'status', label: 'Status', type: 'text', required: false },
    ],
    sampleData: 'order_date,order_id,member_id,amount,plan,rep,channel,status\n2024-01-15,ORD001,M12345,299.99,Premium,Alice Johnson,Online,Completed\n2024-01-16,ORD002,M12346,149.99,Basic,Bob Smith,Phone,Completed',
  },
  operations: {
    name: 'Operations',
    color: 'orange',
    fields: [
      { key: 'cancel_date', label: 'Cancellation Date', type: 'date', required: true },
      { key: 'member_id', label: 'Member ID', type: 'text', required: false },
      { key: 'reason', label: 'Cancellation Reason', type: 'text', required: false },
      { key: 'agent', label: 'Agent', type: 'text', required: false },
      { key: 'save_attempted', label: 'Save Attempted', type: 'boolean', required: false },
      { key: 'save_successful', label: 'Save Successful', type: 'boolean', required: false },
      { key: 'mrr_lost', label: 'MRR Lost', type: 'number', required: false },
    ],
    sampleData: 'cancel_date,member_id,reason,agent,save_attempted,save_successful,mrr_lost\n2024-01-15,M12345,Cost concerns,Sarah Wilson,true,false,99.99\n2024-01-16,M12346,Moving,Tom Brown,true,true,149.99',
  },
  finance: {
    name: 'Finance',
    color: 'green',
    fields: [
      { key: 'record_date', label: 'Record Date', type: 'date', required: true },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'description', label: 'Description', type: 'text', required: false },
      { key: 'vendor_customer', label: 'Vendor/Customer', type: 'text', required: false },
      { key: 'status', label: 'Status', type: 'text', required: false },
      { key: 'notes', label: 'Notes', type: 'text', required: false },
    ],
    sampleData: 'record_date,category,amount,description,vendor_customer,status,notes\n2024-01-15,revenue,5000.00,Monthly subscriptions,Multiple,active,Regular monthly intake\n2024-01-16,expense,1200.00,Software licenses,Vendor Inc,active,Annual renewal',
  },
  saudemax: {
    name: 'SaudeMAX',
    color: 'purple',
    fields: [
      { key: 'enrollment_date', label: 'Enrollment Date', type: 'date', required: true },
      { key: 'member_id', label: 'Member ID', type: 'text', required: false },
      { key: 'program_type', label: 'Program Type', type: 'text', required: false },
      { key: 'status', label: 'Status', type: 'text', required: false },
      { key: 'engagement_score', label: 'Engagement Score', type: 'number', required: false },
      { key: 'satisfaction_score', label: 'Satisfaction Score', type: 'number', required: false },
      { key: 'health_improvement', label: 'Health Improvement', type: 'number', required: false },
    ],
    sampleData: 'enrollment_date,member_id,program_type,status,engagement_score,satisfaction_score,health_improvement\n2024-01-15,M12345,Wellness,active,85,90,15\n2024-01-16,M12346,Fitness,active,92,88,20',
  },
};

export function PublicDepartmentUpload() {
  const { department } = useParams<{ department: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', message: '' });
  const [showPreview, setShowPreview] = useState(false);

  const config = department && DEPARTMENT_CONFIG[department as keyof typeof DEPARTMENT_CONFIG];

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Department</h1>
          <p className="text-gray-600 mb-6">The specified department was not found.</p>
          <button
            onClick={() => navigate('/public/upload')}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Return to Department Selection
          </button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setProgress({
        status: 'error',
        message: 'Please upload a CSV file',
      });
      return;
    }

    setFile(selectedFile);
    setProgress({ status: 'validating', message: 'Validating file...' });

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setProgress({
            status: 'error',
            message: 'CSV parsing error',
            errors: results.errors.map(e => e.message),
          });
          return;
        }

        setParsedData(results.data);
        setProgress({
          status: 'idle',
          message: `File validated successfully. ${results.data.length} rows ready to upload.`,
          totalRows: results.data.length,
        });
      },
      error: (error) => {
        setProgress({
          status: 'error',
          message: error.message,
        });
      },
    });
  };

  const handleUpload = async () => {
    if (!file || parsedData.length === 0) return;

    setProgress({ status: 'uploading', message: 'Uploading data...', rowsProcessed: 0, totalRows: parsedData.length });

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/department-data-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department,
          data: parsedData,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            rowCount: parsedData.length,
          },
          orgId: 'public-upload',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProgress({
          status: 'success',
          message: `Successfully uploaded ${result.rowsImported} rows!`,
          rowsProcessed: result.rowsImported,
          totalRows: parsedData.length,
        });
      } else {
        setProgress({
          status: 'error',
          message: result.error || 'Upload failed',
          errors: result.errors,
        });
      }
    } catch (error) {
      setProgress({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([config.sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${department}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate('/public/upload')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Department Selection</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 bg-gradient-to-br from-${config.color}-500 to-${config.color}-600 rounded-xl flex items-center justify-center shadow-lg`}>
              <FileSpreadsheet className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{config.name} Data Upload</h1>
              <p className="text-gray-600">Upload CSV files with your department data</p>
            </div>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-pink-900 mb-2">Required Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {config.fields.map((field) => (
                <div key={field.key} className="text-sm text-pink-800">
                  <span className="font-medium">{field.label}</span>
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  <span className="text-pink-600 ml-2">({field.type})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download size={18} />
              <span>Download CSV Template</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-6 hover:border-pink-400 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">CSV files only</p>
            </label>
          </div>

          {progress.status !== 'idle' && (
            <div className={`rounded-lg p-4 mb-6 ${
              progress.status === 'success' ? 'bg-green-50 border border-green-200' :
              progress.status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-pink-50 border border-pink-200'
            }`}>
              <div className="flex items-start gap-3">
                {progress.status === 'success' && <CheckCircle className="text-green-600 mt-1" size={20} />}
                {progress.status === 'error' && <AlertCircle className="text-red-600 mt-1" size={20} />}
                <div className="flex-1">
                  <p className={`font-medium ${
                    progress.status === 'success' ? 'text-green-900' :
                    progress.status === 'error' ? 'text-red-900' :
                    'text-pink-900'
                  }`}>
                    {progress.message}
                  </p>
                  {progress.errors && progress.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {progress.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {parsedData.length > 0 && progress.status !== 'success' && (
            <div className="flex gap-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye size={18} />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
              <button
                onClick={handleUpload}
                disabled={progress.status === 'uploading'}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={18} />
                <span>{progress.status === 'uploading' ? 'Uploading...' : 'Upload Data'}</span>
              </button>
            </div>
          )}

          {showPreview && parsedData.length > 0 && (
            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Data Preview (First 5 rows)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(parsedData[0] || {}).map((key) => (
                        <th key={key} className="px-4 py-2 text-left font-medium text-gray-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.values(row).map((value: any, cellIdx) => (
                          <td key={cellIdx} className="px-4 py-2 text-gray-900">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {progress.status === 'success' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setProgress({ status: 'idle', message: '' });
                  setShowPreview(false);
                }}
                className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Upload Another File
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Upload Guidelines</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
              <span>Ensure your CSV file includes all required fields marked with *</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
              <span>Date fields should be in YYYY-MM-DD format</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
              <span>Boolean fields should be true/false</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
              <span>Numbers should not include currency symbols or commas</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
