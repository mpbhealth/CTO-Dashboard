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
    name: 'Sales Orders',
    color: 'blue',
    fields: [
      { key: 'Date', label: 'Date', type: 'text', required: true },
      { key: 'Name', label: 'Name', type: 'text', required: true },
      { key: 'Plan', label: 'Plan', type: 'text', required: true },
      { key: 'Size', label: 'Size', type: 'text', required: true },
      { key: 'Agent', label: 'Agent', type: 'text', required: true },
      { key: 'Group?', label: 'Group?', type: 'boolean', required: false },
    ],
    sampleData: 'Date,Name,Plan,Size,Agent,Group?\n10/1/2025,Russell Clark,Secure HSA,M+S,Misty Berryman,FALSE\n1-Oct,George J Thibault,Secure HSA,MO,Enrollment Website,FALSE\n2-Oct,Aryn e Graham,DIRECT,MO,Jonathan Masters,FALSE\n3-Oct,Rachel S Terrell,Secure HSA,MO,Wiley Long,FALSE',
  },
  'sales-leads': {
    name: 'Sales Leads',
    color: 'green',
    fields: [
      { key: 'Date', label: 'Date', type: 'text', required: true },
      { key: 'Name', label: 'Name', type: 'text', required: true },
      { key: 'Source', label: 'Source', type: 'text', required: true },
      { key: 'Status', label: 'Status', type: 'text', required: true },
      { key: 'Lead Owner', label: 'Lead Owner', type: 'text', required: true },
      { key: 'Group Lead?', label: 'Group Lead?', type: 'boolean', required: false },
      { key: 'Recent Notes', label: 'Recent Notes', type: 'text', required: false },
    ],
    sampleData: 'Date,Name,Source,Status,Lead Owner,Group Lead?,Recent Notes\n10/13/2025,Isaac Brown,Website Visit,In process,Leonardo Moraes,TRUE,List bill signed\n10/14/2025,Michelle Cristalli,Website Visit,In process,Leonardo Moraes,FALSE,Quoted on Premium Care\n21-Oct,Teresa Goodman,Referall,N/a,Tupac Manzanarez,FALSE,',
  },
  'sales-cancelations': {
    name: 'Sales Cancelations',
    color: 'amber',
    fields: [
      { key: 'Name:', label: 'Name', type: 'text', required: true },
      { key: 'Reason:', label: 'Reason', type: 'text', required: true },
      { key: 'Membership:', label: 'Membership', type: 'text', required: false },
      { key: 'Advisor:', label: 'Advisor', type: 'text', required: false },
      { key: 'Outcome:', label: 'Outcome', type: 'text', required: false },
    ],
    sampleData: 'Name:,Reason:,Membership:,Advisor:,Outcome:\nLisa Perry,Aging into Medicare,Secure HSA,Wiley Long,Left VM\nLaurie Boehk,Found more compehensive coverage,MEC + Eseentials,Karen Torsoe,Left VM\nMorgan Harris,Other,Care Plus,Cindy Gordon,Retained',
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
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-pink-50/30 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.03),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.02),transparent_50%)] pointer-events-none" />
        <div className="relative text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Invalid Department</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">The specified department was not found. Please select a valid department from the portal.</p>
          <button
            onClick={() => navigate('/public/upload')}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 hover:shadow-xl transition-all font-semibold shadow-lg hover:-translate-y-0.5"
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publicUploadToken = import.meta.env.VITE_PUBLIC_UPLOAD_TOKEN;

      if (!supabaseUrl) {
        setProgress({
          status: 'error',
          message: 'Upload endpoint is not configured. Please contact support.',
        });
        return;
      }

      if (!publicUploadToken) {
        setProgress({
          status: 'error',
          message: 'Public upload token is missing. Please provide VITE_PUBLIC_UPLOAD_TOKEN in your environment.',
        });
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Public-Upload-Token': publicUploadToken,
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/department-data-upload`, {
        method: 'POST',
        headers,
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-pink-50/30 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.03),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.02),transparent_50%)] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <button
          onClick={() => navigate('/public/upload')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          <span>Back to Department Selection</span>
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">{config.name} Data Upload</h1>
          <p className="text-lg text-gray-600">Upload your CSV files to sync department data with the executive dashboard</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                <FileSpreadsheet className="text-gray-700" size={26} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Upload Configuration</h2>
                <p className="text-sm text-gray-500">CSV file with {config.name.toLowerCase()} department data</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-50/50 border border-pink-200/60 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-pink-600" />
              Required Fields
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.fields.map((field) => (
                <div key={field.key} className="text-sm text-gray-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  <span className="font-medium">{field.label}</span>
                  {field.required && <span className="text-red-500">*</span>}
                  <span className="text-gray-500">({field.type})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm"
            >
              <Download size={18} />
              <span>Download CSV Template</span>
            </button>
          </div>

          <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center mb-8 hover:border-pink-400 hover:bg-gradient-to-br hover:from-pink-50/30 hover:to-pink-50/10 transition-all duration-300 group">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-50 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Upload className="w-10 h-10 text-pink-600" />
              </div>
              <p className="text-xl font-semibold text-gray-900 mb-2">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">CSV files only • Max file size: 10MB</p>
            </label>
          </div>

          {progress.status !== 'idle' && (
            <div className={`rounded-xl p-6 mb-8 border ${
              progress.status === 'success' ? 'bg-gradient-to-br from-green-50 to-green-50/50 border-green-200' :
              progress.status === 'error' ? 'bg-gradient-to-br from-red-50 to-red-50/50 border-red-200' :
              'bg-gradient-to-br from-pink-50 to-pink-50/50 border-pink-200'
            }`}>
              <div className="flex items-start gap-3">
                {progress.status === 'success' && <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={22} />}
                {progress.status === 'error' && <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={22} />}
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    progress.status === 'success' ? 'text-green-900' :
                    progress.status === 'error' ? 'text-red-900' :
                    'text-pink-900'
                  }`}>
                    {progress.message}
                  </p>
                  {progress.errors && progress.errors.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-red-700">
                      {progress.errors.map((error, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{error}</span>
                        </li>
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
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold shadow-sm hover:shadow-md"
              >
                <Eye size={20} />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
              <button
                onClick={handleUpload}
                disabled={progress.status === 'uploading'}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:-translate-y-0.5"
              >
                <Upload size={20} />
                <span>{progress.status === 'uploading' ? 'Uploading...' : 'Upload Data'}</span>
              </button>
            </div>
          )}

          {showPreview && parsedData.length > 0 && (
            <div className="mt-8 border border-gray-200/60 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Eye size={16} className="text-gray-600" />
                  Data Preview (First 5 rows)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(parsedData[0] || {}).map((key) => (
                        <th key={key} className="px-5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/30 transition-colors">
                        {Object.values(row).map((value: any, cellIdx) => (
                          <td key={cellIdx} className="px-5 py-3 text-gray-900 whitespace-nowrap">
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
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setProgress({ status: 'idle', message: '' });
                  setShowPreview(false);
                }}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 hover:shadow-xl transition-all font-semibold shadow-lg hover:-translate-y-0.5"
              >
                Upload Another File
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-gray-600" />
            Upload Guidelines
          </h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
              <span>Ensure your CSV file includes all required fields marked with *</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
              <span>Date fields should be in YYYY-MM-DD format</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
              <span>Boolean fields should be true/false</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
              <span>Numbers should not include currency symbols or commas</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
