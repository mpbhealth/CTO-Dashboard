import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, RefreshCw, FileUp, Download } from 'lucide-react';
import Papa from 'papaparse';
import { SaaSExpenseCreateData } from '../../hooks/useSaaSExpenses';

interface SaaSExpenseUploaderProps {
  onSuccess: (count: number) => void;
  onError: (error: string) => void;
  onBulkImport: (expenses: any[]) => Promise<{ success: boolean; error?: string; count?: number }>;
}

interface ParsedExpenseRow {
  department: string;
  application: string;
  description: string;
  cost_monthly: number;
  cost_annual: number;
  platform: string;
  url: string;
  renewal_date: string;
  notes: string;
  source_sheet: string;
}

export default function SaaSExpenseUploader({ onSuccess, onError, onBulkImport }: SaaSExpenseUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ParsedExpenseRow[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const resetState = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setPreviewData(null);
    setShowPreview(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      resetState();
      setFile(e.target.files[0]);
    }
  };

  const expectedHeaders = [
    'department',
    'application', 
    'description',
    'cost_monthly',
    'cost_annual',
    'platform',
    'url',
    'renewal_date',
    'notes',
    'source_sheet'
  ];

  // Alternative header mappings for flexibility
  const headerMappings = {
    'dept': 'department',
    'expenses': 'department',
    'app': 'application',
    'application_name': 'application',
    'tool': 'application',
    'monthly_cost': 'cost_monthly',
    'cost_per_month': 'cost_monthly',
    'annual_cost': 'cost_annual',
    'cost_per_year': 'cost_annual',
    'yearly_cost': 'cost_annual',
    'website': 'url',
    'link': 'url',
    'renewal': 'renewal_date',
    'next_renewal': 'renewal_date',
    'comments': 'notes',
    'source': 'source_sheet'
  };

  const normalizeHeader = (header: string): string => {
    const normalized = header.toLowerCase().trim().replace(/\s+/g, '_');
    return headerMappings[normalized] || normalized;
  };

  const validateAndParseRow = (row: any): { isValid: boolean; parsedRow?: ParsedExpenseRow; errors: string[] } => {
    const errors: string[] = [];
    
    // Required fields validation
    if (!row.department?.trim()) {
      errors.push('Department is required');
    }
    
    if (!row.application?.trim()) {
      errors.push('Application name is required');
    }

    // Parse monetary values
    let costMonthly = 0;
    let costAnnual = 0;
    
    if (row.cost_monthly) {
      const monthly = parseFloat(String(row.cost_monthly).replace(/[$,]/g, ''));
      if (isNaN(monthly) || monthly < 0) {
        errors.push('Monthly cost must be a valid positive number');
      } else {
        costMonthly = monthly;
      }
    }
    
    if (row.cost_annual) {
      const annual = parseFloat(String(row.cost_annual).replace(/[$,]/g, ''));
      if (isNaN(annual) || annual < 0) {
        errors.push('Annual cost must be a valid positive number');
      } else {
        costAnnual = annual;
      }
    }

    // At least one cost should be provided
    if (costMonthly === 0 && costAnnual === 0) {
      errors.push('Either monthly or annual cost must be provided');
    }

    // Validate URL format if provided
    if (row.url && row.url.trim()) {
      try {
        new URL(row.url.trim());
      } catch {
        // If it doesn't start with http/https, try adding https://
        if (!row.url.startsWith('http')) {
          row.url = 'https://' + row.url;
          try {
            new URL(row.url);
          } catch {
            errors.push('URL must be a valid web address');
          }
        } else {
          errors.push('URL must be a valid web address');
        }
      }
    }

    // Validate renewal date if provided
    if (row.renewal_date && row.renewal_date.trim()) {
      const date = new Date(row.renewal_date);
      if (isNaN(date.getTime())) {
        errors.push('Renewal date must be a valid date (YYYY-MM-DD format)');
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const parsedRow: ParsedExpenseRow = {
      department: row.department.trim(),
      application: row.application.trim(),
      description: row.description?.trim() || '',
      cost_monthly: costMonthly,
      cost_annual: costAnnual,
      platform: row.platform?.trim() || '',
      url: row.url?.trim() || '',
      renewal_date: row.renewal_date?.trim() || '',
      notes: row.notes?.trim() || '',
      source_sheet: row.source_sheet?.trim() || 'csv_import'
    };

    return { isValid: true, parsedRow, errors: [] };
  };

  const handlePreview = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => normalizeHeader(header),
        complete: (results) => {
          if (results.errors.length > 0) {
            setError('CSV parsing errors: ' + results.errors.map(e => e.message).join(', '));
            setIsLoading(false);
            return;
          }

          const validRows: ParsedExpenseRow[] = [];
          const errorMessages: string[] = [];

          results.data.forEach((row: any, index: number) => {
            const { isValid, parsedRow, errors } = validateAndParseRow(row);
            
            if (isValid && parsedRow) {
              validRows.push(parsedRow);
            } else {
              errorMessages.push(`Row ${index + 2}: ${errors.join(', ')}`);
            }
          });

          if (validRows.length === 0) {
            setError('No valid rows found in CSV. Please check your data format.');
          } else {
            setPreviewData(validRows);
            setShowPreview(true);
            if (errorMessages.length > 0) {
              setError(`${validRows.length} valid rows found. Errors in ${errorMessages.length} rows: ${errorMessages.slice(0, 3).join('; ')}${errorMessages.length > 3 ? '...' : ''}`);
            }
          }
          
          setIsLoading(false);
        },
        error: (error) => {
          setError(`Error parsing CSV: ${error.message}`);
          setIsLoading(false);
        }
      });
    } catch (err) {
      setError(`Error processing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await onBulkImport(previewData);
      
      if (result.success) {
        setSuccess(`Successfully imported ${result.count} SaaS expenses!`);
        setPreviewData(null);
        setShowPreview(false);
        setFile(null);
        onSuccess(result.count || 0);
      } else {
        setError(result.error || 'Import failed');
      }
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      expectedHeaders.join(','),
      'Engineering,Supabase,Database and Backend Services,50,600,Cloud Platform,https://supabase.com,2025-06-15,Production database,csv_import',
      'Marketing,HubSpot,CRM and Marketing Automation,120,1440,Marketing Platform,https://hubspot.com,2025-08-20,Sales pipeline management,csv_import'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'saas_expenses_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Import SaaS Expenses</h3>
      
      {/* Format Instructions */}
      <div className="mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">CSV Format Instructions</h4>
          <p className="text-xs text-blue-700 mb-2">Your CSV file should contain the following headers:</p>
          <p className="text-xs font-mono bg-white p-2 rounded border border-blue-100 text-blue-800 overflow-x-auto whitespace-nowrap mb-2">
            department,application,description,cost_monthly,cost_annual,platform,url,renewal_date,notes,source_sheet
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadTemplate}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Download Template CSV
            </button>
          </div>
        </div>
      </div>
      
      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select CSV File
        </label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center">
          <Upload className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm text-slate-600 mb-1">
            Drag & drop your CSV file here or click to browse
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Accepts CSV files with SaaS expense data
          </p>
          <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
            <span>{file ? file.name : 'Select CSV File'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Preview Table */}
      {showPreview && previewData && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">
            Preview ({previewData.length} expenses found)
          </h4>
          <div className="overflow-x-auto max-h-64 border border-slate-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-700">Department</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-700">Application</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-700">Monthly</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-700">Annual</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-700">Platform</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-700">Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previewData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-900">{row.department}</td>
                    <td className="px-3 py-2 text-slate-900">{row.application}</td>
                    <td className="px-3 py-2 text-slate-900">${row.cost_monthly}</td>
                    <td className="px-3 py-2 text-slate-900">${row.cost_annual}</td>
                    <td className="px-3 py-2 text-slate-600">{row.platform}</td>
                    <td className="px-3 py-2 text-slate-600">{row.renewal_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length > 10 && (
            <p className="text-xs text-slate-500 mt-2">
              Showing first 10 rows. {previewData.length - 10} more rows will be imported.
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {file && !showPreview && (
          <button
            onClick={handlePreview}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Parsing...</span>
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4" />
                <span>Preview Data</span>
              </>
            )}
          </button>
        )}

        {showPreview && previewData && (
          <>
            <button
              onClick={() => {
                setShowPreview(false);
                setPreviewData(null);
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Import {previewData.length} Expenses</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}