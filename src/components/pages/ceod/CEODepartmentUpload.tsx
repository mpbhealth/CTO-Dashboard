import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Papa from 'papaparse';

interface UploadResult {
  success: boolean;
  rowsImported: number;
  rowsFailed: number;
  errors?: string[];
  uploadId?: string;
}

const DEPARTMENT_OPTIONS = [
  { value: 'concierge', label: 'Concierge Team', description: 'Upload concierge interactions and support tickets' },
  { value: 'sales', label: 'Sales Team', description: 'Upload sales orders and pipeline data' },
  { value: 'operations', label: 'Operations Team', description: 'Upload cancellations and churn data' },
  { value: 'finance', label: 'Finance Team', description: 'Upload financial records (AR, AP, Payouts)' },
];

export function CEODepartmentUpload() {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);

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
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      alert('Please upload a CSV or Excel file');
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file || !selectedDepartment) {
      alert('Please select a department and file to upload');
      return;
    }

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      setProgress(20);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            setProgress(40);

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const functionUrl = `${supabaseUrl}/functions/v1/department-data-upload`;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              throw new Error('No active session');
            }

            setProgress(60);

            const uploadMetadata = {
              department: selectedDepartment,
              fileName: file.name,
              fileSize: file.size,
              rowCount: results.data.length,
            };

            const response = await fetch(functionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                department: selectedDepartment,
                data: results.data,
                metadata: uploadMetadata,
                orgId: profile.org_id,
              }),
            });

            setProgress(80);

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Upload failed');
            }

            const uploadResult: UploadResult = await response.json();
            setProgress(100);
            setResult(uploadResult);
            setFile(null);
          } catch (error) {
            console.error('Upload error:', error);
            setResult({
              success: false,
              rowsImported: 0,
              rowsFailed: 0,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            });
          } finally {
            setUploading(false);
          }
        },
        error: (error) => {
          console.error('CSV parse error:', error);
          setResult({
            success: false,
            rowsImported: 0,
            rowsFailed: 0,
            errors: ['Failed to parse file'],
          });
          setUploading(false);
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        rowsImported: 0,
        rowsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedDepartment) {
      alert('Please select a department first');
      return;
    }

    try {
      const { data: template, error } = await supabase
        .from('upload_templates')
        .select('*')
        .eq('department', selectedDepartment)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error || !template) {
        alert('Template not found for this department');
        return;
      }

      const schema = template.schema_definition as { columns: Array<{ name: string }> };
      const sampleData = template.sample_data as Array<Record<string, unknown>>;

      const headers = schema.columns.map((col) => col.name);
      const csv = [
        headers.join(','),
        ...sampleData.map((row) => headers.map((h) => row[h] || '').join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedDepartment}_upload_template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download error:', error);
      alert('Failed to download template');
    }
  };

  return (
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Upload className="text-[#1a3d97]" size={32} />
            Department Data Upload
          </h1>
          <p className="text-gray-600 mt-1">
            Upload department data to populate CEO analytics dashboards
          </p>
        </div>

        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-pink-800">
              <p className="font-medium mb-2">How to use this portal:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Select your department from the options below</li>
                <li>Download the CSV template for your department</li>
                <li>Fill in your data following the template format</li>
                <li>Upload your completed CSV file</li>
                <li>Data will be validated and sent to the CEO dashboard</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Department</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEPARTMENT_OPTIONS.map((dept) => (
              <button
                key={dept.value}
                onClick={() => setSelectedDepartment(dept.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedDepartment === dept.value
                    ? 'border-[#1a3d97] bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet
                    size={20}
                    className={selectedDepartment === dept.value ? 'text-[#1a3d97]' : 'text-gray-400'}
                  />
                  <h3 className="font-semibold text-gray-900">{dept.label}</h3>
                </div>
                <p className="text-sm text-gray-600">{dept.description}</p>
              </button>
            ))}
          </div>

          {selectedDepartment && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Download size={18} />
                Download Template
              </button>
            </div>
          )}
        </div>

        {selectedDepartment && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>
            <form
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx"
                onChange={handleChange}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {uploading ? 'Uploading...' : file ? file.name : 'Drop CSV file here or click to browse'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload data for {DEPARTMENT_OPTIONS.find((d) => d.value === selectedDepartment)?.label}
                  </p>
                </div>
              </label>
            </form>

            {file && !uploading && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleUpload}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  <Upload size={20} />
                  Upload Data
                </button>
              </div>
            )}

            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Processing upload...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#1a3d97] to-[#00A896] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {result && (
              <div
                className={`mt-4 rounded-lg p-4 ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4
                      className={`font-medium ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {result.success ? 'Upload Completed' : 'Upload Failed'}
                    </h4>
                    <div className="mt-2 text-sm space-y-1">
                      <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                        <span className="font-medium">{result.rowsImported}</span> rows imported successfully
                      </p>
                      {result.rowsFailed > 0 && (
                        <p className="text-red-700">
                          <span className="font-medium">{result.rowsFailed}</span> rows failed
                        </p>
                      )}
                    </div>

                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center space-x-2 text-amber-800">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs font-medium">Errors:</span>
                        </div>
                        <ul className="text-xs text-red-600 space-y-1 ml-6 list-disc">
                          {result.errors.slice(0, 5).map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li className="text-gray-600">
                              ... and {result.errors.length - 5} more errors
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-gradient-to-br from-[#1a3d97] to-[#00A896] rounded-lg p-6 text-white">
          <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
          <p className="text-pink-50 text-sm mb-4">
            If you encounter any issues with uploading data or need assistance with the template format,
            please contact your system administrator or the CEO office.
          </p>
          <div className="flex gap-3">
            <a
              href="/ceod/data"
              className="px-4 py-2 bg-white text-[#1a3d97] rounded-lg hover:bg-pink-50 transition-colors text-sm font-medium"
            >
              View Upload History
            </a>
          </div>
        </div>
      </div>
    );
}

