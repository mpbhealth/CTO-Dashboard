import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  required: boolean;
}

interface ImportError {
  row: number;
  message: string;
}

interface ImportResult {
  success: number;
  errors: ImportError[];
}

interface ImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  columnMappings: ColumnMapping[];
  onImport: (data: Record<string, unknown>[]) => Promise<ImportResult>;
  templateData?: Record<string, unknown>[];
}

export const ImporterModal: React.FC<ImporterModalProps> = ({
  isOpen,
  onClose,
  title,
  columnMappings,
  onImport,
  templateData,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'complete'>('upload');
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;
        
        if (file.name.endsWith('.csv')) {
          workbook = XLSX.read(data, { type: 'binary' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

        if (jsonData.length > 0) {
          const headerRow = jsonData[0] as string[];
          setHeaders(headerRow);
          
          const dataRows = jsonData.slice(1, 6); // Preview first 5 rows
          setPreviewData(dataRows.map(row => {
            const obj: Record<string, unknown> = {};
            headerRow.forEach((header, idx) => {
              obj[header] = row[idx];
            });
            return obj;
          }));

          // Auto-map columns with matching names
          const autoMappings: Record<string, string> = {};
          columnMappings.forEach(mapping => {
            const matchingHeader = headerRow.find(
              h => h.toLowerCase() === mapping.targetField.toLowerCase()
            );
            if (matchingHeader) {
              autoMappings[mapping.targetField] = matchingHeader;
            }
          });
          setMappings(autoMappings);

          setStep('map');
        }
      } catch (error) {
        console.error('Failed to parse file:', error);
        alert('Failed to parse file. Please check the file format.');
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleMapping = (targetField: string, sourceColumn: string) => {
    setMappings(prev => ({ ...prev, [targetField]: sourceColumn }));
  };

  const validateMappings = (): boolean => {
    const requiredFields = columnMappings.filter(m => m.required);
    return requiredFields.every(field => mappings[field.targetField]);
  };

  const transformData = (): Promise<Record<string, unknown>[]> => {
    if (!file) return [];

    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = file.name.endsWith('.csv')
          ? XLSX.read(data, { type: 'binary' })
          : XLSX.read(data, { type: 'array' });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];

        const transformed = jsonData.map(row => {
          const transformedRow: Record<string, unknown> = {};
          Object.entries(mappings).forEach(([targetField, sourceColumn]) => {
            transformedRow[targetField] = row[sourceColumn];
          });
          return transformedRow;
        });

        resolve(transformed);
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleImport = async () => {
    if (!validateMappings()) {
      alert('Please map all required fields');
      return;
    }

    setImporting(true);
    try {
      const transformedData = await transformData();
      const importResult = await onImport(transformedData);
      setResult(importResult);
      setStep('complete');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!templateData) return;

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_template.xlsx`);
  };

  const reset = () => {
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    setMappings({});
    setStep('upload');
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Upload a CSV or Excel file to import data
                </p>
                <input
                  type="file"
                  id="import-file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="import-file"
                  className="inline-block px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 cursor-pointer"
                >
                  Select File
                </label>
              </div>

              {templateData && (
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              )}
            </div>
          )}

          {/* Step 2: Map Columns */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-pink-800">
                  Map the columns from your file to the required fields
                </p>
              </div>

              {columnMappings.map((mapping) => (
                <div key={mapping.targetField} className="flex items-center space-x-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700">
                      {mapping.targetField}
                      {mapping.required && <span className="text-red-600">*</span>}
                    </label>
                  </div>
                  <div className="w-2/3">
                    <select
                      value={mappings[mapping.targetField] || ''}
                      onChange={(e) => handleMapping(mapping.targetField, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select column...</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Preview (first 5 rows)</h4>
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((header) => (
                          <th
                            key={header}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, idx) => (
                        <tr key={idx}>
                          {headers.map((header) => (
                            <td key={header} className="px-4 py-2 text-sm text-gray-900">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && result && (
            <div className="text-center space-y-4">
              {result.errors.length === 0 ? (
                <>
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Import Successful!
                  </h3>
                  <p className="text-gray-600">
                    Successfully imported {result.success} records
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 mx-auto text-yellow-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Import Completed with Errors
                  </h3>
                  <p className="text-gray-600">
                    Successfully imported {result.success} records, {result.errors.length} errors
                  </p>
                  <div className="mt-4 max-h-48 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-4">
                    {result.errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-800 mb-1">
                        Row {error.row}: {error.message}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={step === 'complete' ? handleClose : () => setStep('upload')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {step === 'complete' ? 'Close' : 'Back'}
          </button>
          
          {step === 'map' && (
            <button
              onClick={handleImport}
              disabled={!validateMappings() || importing}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : 'Import Data'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

