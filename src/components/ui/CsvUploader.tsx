import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, RefreshCw, FileUp } from 'lucide-react';
import Papa from 'papaparse';
import { UniversalImportRecord, processUniversalImport, sanitizeObject, sanitizeString } from '../../lib/supabaseUtils';

interface CsvUploaderProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  importType?: 'enrollment' | 'status' | 'universal';
  title?: string;
  description?: string;
}

export default function CsvUploader({ onSuccess, onError }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<{ 
    enrollments: { inserted: number; errors: number }; 
    statusUpdates: { inserted: number; errors: number };
    total: number 
  } | null>(null);

  const resetState = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setStats(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      resetState();
      setFile(e.target.files[0]);
    }
  };

  const validateHeaders = (headers: string[]): boolean => {
    const universalRequiredHeaders = [
      'record_type',
      'member_id'
    ];
    
    const enrollmentHeaders = [
      'enrollment_id',
      'enrollment_date',
      'program_name',
      'enrollment_status',
      'premium_amount'
    ];
    
    const statusHeaders = [
      'status_date',
      'new_status'
    ];
    
    // Check if universal required headers are present
    const hasUniversalHeaders = universalRequiredHeaders.every(header => headers.includes(header));
    
    // Ensure we have either enrollment headers or status headers or both
    const hasEnrollmentHeaders = enrollmentHeaders.every(header => headers.includes(header));
    const hasStatusHeaders = statusHeaders.every(header => headers.includes(header));
    
    return hasUniversalHeaders && (hasEnrollmentHeaders || hasStatusHeaders);
  };

  const validateRow = (row: any): { isValid: boolean; errors: string[]; validTypes: string[] } => {
    const errors: string[] = [];
    const validTypes: string[] = [];
    
    // Check record_type
    if (!row.record_type) {
      errors.push('Missing record_type');
    } else if (!['enrollment', 'status_update', 'both'].includes(row.record_type)) {
      errors.push(`Invalid record_type: ${row.record_type}. Must be 'enrollment', 'status_update', or 'both'.`);
    }

    // Check member_id (required for all record types)
    if (!row.member_id) errors.push('Missing member_id');

    // Validate enrollment data if record_type is 'enrollment' or 'both'
    if (row.record_type === 'enrollment' || row.record_type === 'both') {
      // Check required enrollment fields
      if (!row.enrollment_id) {
        errors.push('Missing enrollment_id for enrollment record');
      } else if (!row.enrollment_date) {
        errors.push('Missing enrollment_date for enrollment record');
      } else if (!row.program_name) {
        errors.push('Missing program_name for enrollment record');
      } else if (!row.enrollment_status) {
        errors.push('Missing enrollment_status for enrollment record');
      } else if (!row.premium_amount) {
        errors.push('Missing premium_amount for enrollment record');
      } else {
        // All required enrollment fields are present
        validTypes.push('enrollment');
        
        // Check enrollment_status is valid
        const validEnrollmentStatuses = ['active', 'pending', 'cancelled', 'lapsed', 'completed'];
        if (!validEnrollmentStatuses.includes(row.enrollment_status.toLowerCase())) {
          errors.push(`Invalid enrollment_status: ${row.enrollment_status}. Must be one of: ${validEnrollmentStatuses.join(', ')}`);
        }
        
        // Check premium_amount is a valid number
        if (isNaN(parseFloat(row.premium_amount))) {
          errors.push(`Invalid premium_amount: ${row.premium_amount}. Must be a number.`);
        }
      }
    }

    // Validate status update data if record_type is 'status_update' or 'both'
    if (row.record_type === 'status_update' || row.record_type === 'both') {
      // Check required status update fields
      if (!row.status_date) {
        errors.push('Missing status_date for status update record');
      } else if (!row.new_status) {
        errors.push('Missing new_status for status update record');
      } else {
        // All required status update fields are present
        validTypes.push('status_update');
        
        // Check new_status is valid
        const validStatusValues = ['active', 'inactive', 'lapsed', 'churned', 'on_hold', 'suspended'];
        if (!validStatusValues.includes(row.new_status.toLowerCase())) {
          errors.push(`Invalid new_status: ${row.new_status}. Must be one of: ${validStatusValues.join(', ')}`);
        }
      }
    }

    // For record_type 'both', ensure we have valid data for both tables
    if (row.record_type === 'both' && validTypes.length !== 2) {
      errors.push(`Record type is 'both' but data is only valid for: ${validTypes.join(', ')}`);
    }

    return { 
      isValid: errors.length === 0 && validTypes.length > 0, 
      errors,
      validTypes 
    };
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setStats(null);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          // Check headers
          if (!validateHeaders(results.meta.fields || [])) {
            setError('Invalid CSV format. Required headers are missing. Make sure your CSV includes at least record_type, member_id, and fields for either enrollment or status updates.');
            setIsLoading(false);
            if (onError) onError('Invalid CSV format. Required headers are missing. Check the expected format description.');
            return;
          }

          const validRows: UniversalImportRecord[] = [];
          const invalidRows: any[] = [];
          
          // Validate all rows
          results.data.forEach((row: any) => {
            // Sanitize the row data first to prevent XSS
            const sanitizedRow = sanitizeObject(row);
            
            const { isValid, errors, validTypes } = validateRow(row);
            if (isValid) {
              // Convert the row to our universal format
              validRows.push(sanitizedRow as UniversalImportRecord);
            } else {
              invalidRows.push({ row: sanitizedRow, errors });
            }
          });

          if (validRows.length === 0) {
            setError('No valid rows found in CSV file.');
            setIsLoading(false);
            if (onError) onError('No valid rows found in CSV file.');
            return;
          }

          // Process the universal import
          const result = await processUniversalImport(validRows);
          
          const totalInserted = result.enrollments.inserted + result.statusUpdates.inserted;
          const totalErrors = result.enrollments.errors + result.statusUpdates.errors + invalidRows.length;

          setStats({
            enrollments: result.enrollments,
            statusUpdates: result.statusUpdates,
            total: results.data.length
          });

          if (totalInserted > 0) {
            setSuccess(`Successfully imported ${totalInserted} records (${result.enrollments.inserted} enrollments, ${result.statusUpdates.inserted} status updates).`);
            if (onSuccess) onSuccess();
          } else {
            setError('Failed to import any records.');
            if (onError) onError('Failed to import any records.');
          }
          
          setIsLoading(false);
        },
        error: (error) => {
          setError(`Error parsing CSV: ${error.message}`);
          setIsLoading(false);
          if (onError) onError(`Error parsing CSV: ${error.message}`);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error processing file: ${errorMessage}`);
      setIsLoading(false);
      if (onError) onError(`Error processing file: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Import Enrollment Data</h3>
      
      {/* Format Instructions */}
      <div className="mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">CSV Format Instructions</h4>
          <p className="text-xs text-blue-700 mb-2">Your CSV file should contain the following headers:</p>
          <p className="text-xs font-mono bg-white p-2 rounded border border-blue-100 text-blue-800 overflow-x-auto whitespace-nowrap mb-2">
            record_type,enrollment_id,member_id,enrollment_date,program_name,enrollment_status,enrollment_source,premium_amount,renewal_date,status_date,new_status,reason,source_system
          </p>
          <p className="text-xs text-blue-700">
            <strong>Required for all records:</strong> record_type, member_id<br/>
            <strong>For enrollment records:</strong> enrollment_id, enrollment_date, program_name, enrollment_status, premium_amount<br/>
            <strong>For status updates:</strong> status_date, new_status<br/>
            <strong>Record types:</strong> 'enrollment', 'status_update', or 'both' (for rows that update both)
          </p>
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
            Ensure your file has the required headers: enrollment_id, member_id, enrollment_date, program_name, enrollment_status, premium_amount
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

      {/* Statistics */}
      {stats && (
        <div className="mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-2">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Import Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-blue-700">
                  {stats.enrollments.inserted + stats.statusUpdates.inserted}
                </p>
                <p className="text-xs text-blue-600">Total Inserted</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-700">
                  {stats.enrollments.errors + stats.statusUpdates.errors}
                </p>
                <p className="text-xs text-amber-600">Errors</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-700">{stats.total}</p>
                <p className="text-xs text-slate-600">Total Records</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <h5 className="text-xs font-medium text-indigo-800 mb-1">Enrollment Records</h5>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700">Inserted:</span>
                  <span className="font-medium text-indigo-800">{stats.enrollments.inserted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700">Errors:</span>
                  <span className="font-medium text-indigo-800">{stats.enrollments.errors}</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <h5 className="text-xs font-medium text-emerald-800 mb-1">Status Update Records</h5>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Inserted:</span>
                  <span className="font-medium text-emerald-800">{stats.statusUpdates.inserted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Errors:</span>
                  <span className="font-medium text-emerald-800">{stats.statusUpdates.errors}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing Universal Import...</span>
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4" />
              <span>Upload & Process</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}