import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useCEODataImport } from '../../hooks/useCEODataImport';
import Papa from 'papaparse';

interface CEODataImporterProps {
  targetTable: 'cancellations' | 'leads' | 'sales' | 'concierge';
  sheetName?: string;
  onImportComplete?: () => void;
}

export function CEODataImporter({ targetTable, sheetName, onImportComplete }: CEODataImporterProps) {
  const { importing, progress, importData } = useCEODataImport();
  const [result, setResult] = useState<{
    success: boolean;
    rowsImported: number;
    rowsFailed: number;
    errors?: string[];
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const importResult = await importData(results.data as Array<Record<string, unknown>>, {
            targetTable,
            sheetName: sheetName || file.name.replace('.csv', ''),
          });

          setResult(importResult);

          if (importResult.success && onImportComplete) {
            onImportComplete();
          }
        } catch (error) {
          console.error('Import failed:', error);
          setResult({
            success: false,
            rowsImported: 0,
            rowsFailed: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          });
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        setResult({
          success: false,
          rowsImported: 0,
          rowsFailed: 0,
          errors: ['Failed to parse CSV file'],
        });
      },
    });
  };

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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const getTableDisplayName = () => {
    const names = {
      cancellations: 'Cancellation Reports',
      leads: 'Lead Reports',
      sales: 'Sales Reports',
      concierge: 'Concierge Reports',
    };
    return names[targetTable];
  };

  return (
    <div className="space-y-4">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${importing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          id={`file-upload-${targetTable}`}
          accept=".csv"
          onChange={handleChange}
          disabled={importing}
          className="hidden"
        />
        <label
          htmlFor={`file-upload-${targetTable}`}
          className="cursor-pointer flex flex-col items-center space-y-2"
        >
          <FileSpreadsheet className="w-12 h-12 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              {importing ? 'Importing...' : 'Drop CSV file here or click to browse'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Import {getTableDisplayName()} data
            </p>
          </div>
        </label>
      </form>

      {importing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Importing data...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg p-4 ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4
                className={`font-medium ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.success ? 'Import Completed' : 'Import Failed'}
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
                    <AlertCircle className="w-4 h-4" />
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Import Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Export your Excel sheet as CSV format</li>
              <li>Ensure column headers match expected format</li>
              <li>Drag and drop or click to upload the CSV file</li>
              <li>Data will be automatically validated and imported</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
