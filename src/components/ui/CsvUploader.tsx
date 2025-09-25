import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, RefreshCw, FileUp } from 'lucide-react';
import Papa from 'papaparse';
import { sanitizeObject, sanitizeString } from '../../lib/supabaseUtils';

interface CustomerImportRecord {
  id_customer: string;
  id_product: string;
  date_active: string;
  date_inactive?: string;
  name_first: string;
  name_last: string;
  product_admin_label: string;
  product_benefit_id: string;
  product_label: string;
  date_created_member: string;
  date_first_billing: string;
  date_last_payment?: string;
  date_next_billing?: string;
  id_agent?: string;
  last_payment?: string;
  last_transaction_amount?: string;
  product_amount: string;
}

interface CsvUploaderProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  importType?: 'customer' | 'enrollment' | 'universal';
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
    customers: { inserted: number; errors: number };
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
    const customerRequiredHeaders = [
      'ID Customer',
      'ID Product',
      'Date Active',
      'Name First',
      'Name Last',
      'Product Amount'
    ];
    
    // Check if customer required headers are present (case-insensitive)
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/\s+/g, ' '));
    const normalizedRequired = customerRequiredHeaders.map(h => h.toLowerCase());
    
    return normalizedRequired.every(required => 
      normalizedHeaders.some(header => header === required)
    );
  };

  const validateRow = (row: any): { isValid: boolean; errors: string[]; validTypes: string[] } => {
    const errors: string[] = [];
    const validTypes: string[] = ['customer'];
    
    // Required fields validation
    if (!row['ID Customer'] && !row['id_customer']) {
      errors.push('Missing ID Customer');
    }
    
    if (!row['ID Product'] && !row['id_product']) {
      errors.push('Missing ID Product');
    }
    
    if (!row['Date Active'] && !row['date_active']) {
      errors.push('Missing Date Active');
    }
    
    if (!row['Name First'] && !row['name_first']) {
      errors.push('Missing Name First');
    }
    
    if (!row['Name Last'] && !row['name_last']) {
      errors.push('Missing Name Last');
    }
    
    if (!row['Product Amount'] && !row['product_amount']) {
      errors.push('Missing Product Amount');
    }
    
    // Validate dates
    const dateActive = row['Date Active'] || row['date_active'];
    if (dateActive && isNaN(Date.parse(dateActive))) {
      errors.push('Invalid Date Active format. Use YYYY-MM-DD or MM/DD/YYYY');
    }
    
    // Validate product amount is a number
    const productAmount = row['Product Amount'] || row['product_amount'];
    if (productAmount && isNaN(parseFloat(String(productAmount).replace(/[$,]/g, '')))) {
      errors.push('Invalid Product Amount. Must be a valid number');
    }

    return { 
      isValid: errors.length === 0 && validTypes.length > 0, 
      errors,
      validTypes 
    };
  };

  const processCustomerImport = async (records: CustomerImportRecord[]) => {
    const enrollmentRecords: any[] = [];
    const statusUpdateRecords: any[] = [];
    
    records.forEach(record => {
      // Map customer data to enrollment format
      const enrollmentId = `${record.id_customer}-${record.id_product}`;
      const memberId = record.id_customer;
      const enrollmentDate = record.date_active;
      const programName = record.product_label || record.product_admin_label;
      const premiumAmount = parseFloat(String(record.product_amount).replace(/[$,]/g, ''));
      
      // Create enrollment record
      enrollmentRecords.push({
        enrollment_id: enrollmentId,
        member_id: memberId,
        enrollment_date: new Date(enrollmentDate).toISOString(),
        program_name: programName,
        enrollment_status: record.date_inactive ? 'cancelled' : 'active',
        enrollment_source: 'csv_import',
        premium_amount: premiumAmount,
        renewal_date: record.date_next_billing ? new Date(record.date_next_billing).toISOString() : null
      });
      
      // Create status update record for active enrollment
      statusUpdateRecords.push({
        member_id: memberId,
        status_date: new Date(enrollmentDate).toISOString(),
        new_status: record.date_inactive ? 'cancelled' : 'active',
        reason: record.date_inactive ? 'Customer cancelled' : 'New enrollment',
        source_system: 'csv_import'
      });
      
      // If there's an inactive date, create another status update
      if (record.date_inactive) {
        statusUpdateRecords.push({
          member_id: memberId,
          status_date: new Date(record.date_inactive).toISOString(),
          new_status: 'cancelled',
          reason: 'Customer cancellation',
          source_system: 'csv_import'
        });
      }
    });
    
    // Import using the existing batch upsert functionality
    const { batchUpsert } = await import('../../lib/supabaseUtils');
    
    const [enrollmentResults, statusUpdateResults] = await Promise.all([
      enrollmentRecords.length > 0 
        ? batchUpsert('member_enrollments', enrollmentRecords, 'enrollment_id') 
        : { inserted: 0, errors: 0 },
      statusUpdateRecords.length > 0
        ? batchUpsert('member_status_updates', statusUpdateRecords, 'id')
        : { inserted: 0, errors: 0 }
    ]);
    
    return {
      enrollments: enrollmentResults,
      customers: statusUpdateResults // Rename for display purposes
    };
  };

  const normalizeFieldName = (fieldName: string): string => {
    // Convert "ID Customer" to "id_customer", "Name First" to "name_first", etc.
    return fieldName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .trim();
  };

  const normalizeRowKeys = (row: any): any => {
    const normalizedRow: any = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = normalizeFieldName(key);
      normalizedRow[normalizedKey] = row[key];
    });
    return normalizedRow;
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
            setError('Invalid CSV format. Required headers are missing. Make sure your CSV includes: ID Customer, ID Product, Date Active, Name First, Name Last, Product Amount');
            setIsLoading(false);
            if (onError) onError('Invalid CSV format. Required headers are missing. Check the expected format description.');
            return;
          }

          const validRows: UniversalImportRecord[] = [];
          const invalidRows: any[] = [];
          
          // Validate all rows
          results.data.forEach((row: any) => {
            // Sanitize the row data first to prevent XSS
            const normalizedRow = normalizeRowKeys(row);
            const sanitizedRow = sanitizeObject(normalizedRow);
            
            const { isValid, errors, validTypes } = validateRow(sanitizedRow);
            if (isValid) {
              // Convert the row to customer import format
              validRows.push(sanitizedRow as CustomerImportRecord);
            } else {
              invalidRows.push({ 
                row: sanitizedRow, 
                errors,
                originalData: row 
              });
            }
          });

          if (validRows.length === 0) {
            setError('No valid rows found in CSV file.');
            setIsLoading(false);
            if (onError) onError('No valid rows found in CSV file.');
            return;
          }

          // Process the customer import
          const result = await processCustomerImport(validRows);
          
          const totalInserted = result.enrollments.inserted + result.customers.inserted;
          const totalErrors = result.enrollments.errors + result.customers.errors + invalidRows.length;

          setStats({
            enrollments: result.enrollments,
            customers: result.customers,
            total: results.data.length
          });

          if (totalInserted > 0) {
            setSuccess(`Successfully imported ${totalInserted} records (${result.enrollments.inserted} enrollments, ${result.customers.inserted} customer updates).`);
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
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Import Customer Data</h3>
      
      {/* Format Instructions */}
      <div className="mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">CSV Format Instructions</h4>
          <p className="text-xs text-blue-700 mb-2">Your CSV file should contain the following headers:</p>
          <p className="text-xs font-mono bg-white p-2 rounded border border-blue-100 text-blue-800 overflow-x-auto whitespace-nowrap mb-2">
            ID Customer,ID Product,Date Active,Date Inactive,Name First,Name Last,Product Admin Label,Product Benefit ID,Product Label,Date Created Member,Date First Billing,Date Last Payment,Date Next Billing,ID Agent,Last Payment,Last Transaction Amount,Product Amount
          </p>
          <p className="text-xs text-blue-700">
            <strong>Required fields:</strong> ID Customer, ID Product, Date Active, Name First, Name Last, Product Amount<br/>
            <strong>Optional fields:</strong> Date Inactive, Product Admin Label, Product Benefit ID, Date Created Member, Date First Billing, Date Last Payment, Date Next Billing, ID Agent, Last Payment, Last Transaction Amount<br/>
            <strong>Date formats:</strong> YYYY-MM-DD or MM/DD/YYYY are supported
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
            Ensure your file has the required headers: ID Customer, ID Product, Date Active, Name First, Name Last, Product Amount
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
                <h5 className="text-xs font-medium text-indigo-800 mb-1">Customer Enrollment Records</h5>
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
                <h5 className="text-xs font-medium text-emerald-800 mb-1">Customer Status Records</h5>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Inserted:</span>
                  <span className="font-medium text-emerald-800">{stats.customers.inserted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Errors:</span>
                  <span className="font-medium text-emerald-800">{stats.customers.errors}</span>
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
              <span>Upload & Process Customer Data</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}