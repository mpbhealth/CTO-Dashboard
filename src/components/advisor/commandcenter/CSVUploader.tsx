import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Download,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import {
  parseCSVFile,
  autoDetectColumnMappings,
  getTargetFieldOptions,
  validateMemberData,
  importMembers,
  downloadCSVTemplate,
} from '../../../lib/memberIngestionService';
import type {
  CSVParseResult,
  CSVColumnMapping,
  MemberValidationResult,
  ImportResult,
  Member,
} from '../../../types/commandCenter';

interface CSVUploaderProps {
  advisorId: string;
  onImportComplete?: (result: ImportResult) => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'processing' | 'complete';

export default function CSVUploader({ advisorId, onImportComplete }: CSVUploaderProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [mappings, setMappings] = useState<CSVColumnMapping[]>([]);
  const [validationResult, setValidationResult] = useState<MemberValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetFieldOptions = getTargetFieldOptions();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      await handleFileSelect(droppedFile);
    } else {
      setError('Please upload a CSV file');
    }
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    try {
      const result = await parseCSVFile(selectedFile);
      setParseResult(result);

      const detectedMappings = autoDetectColumnMappings(result.headers, result.preview[0]);
      setMappings(detectedMappings);

      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (csvColumn: string, targetField: keyof Member | '') => {
    setMappings((prev) =>
      prev.map((m) =>
        m.csvColumn === csvColumn
          ? { ...m, targetField: targetField || null }
          : m
      )
    );
  };

  const handleValidate = () => {
    if (!parseResult) return;

    const result = validateMemberData(parseResult.rows, mappings);
    setValidationResult(result);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!validationResult || !file) return;

    setStep('processing');
    setIsProcessing(true);

    try {
      const result = await importMembers(
        validationResult.validatedData,
        advisorId,
        file.name
      );
      setImportResult(result);
      setStep('complete');
      onImportComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setParseResult(null);
    setMappings([]);
    setValidationResult(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const requiredFieldsMapped = ['first_name', 'last_name', 'date_of_birth'].every((field) =>
    mappings.some((m) => m.targetField === field)
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Upload className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Import Members</h3>
            <p className="text-sm text-gray-500">Upload a CSV file to add new members</p>
          </div>
        </div>
        <button
          onClick={downloadCSVTemplate}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {['upload', 'mapping', 'preview', 'complete'].map((s, i) => {
            const stepNum = i + 1;
            const stepLabel = ['Upload File', 'Map Columns', 'Review & Import', 'Complete'][i];
            const isActive = step === s || (step === 'processing' && s === 'preview');
            const isCompleted = ['upload', 'mapping', 'preview', 'processing', 'complete'].indexOf(step) > i;

            return (
              <div key={s} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-100 text-cyan-700'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-xs">
                      {stepNum}
                    </span>
                  )}
                  {stepLabel}
                </div>
                {i < 3 && <ChevronRight className="w-4 h-4 text-gray-300 mx-2" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Upload Step */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                {isProcessing ? (
                  <Loader2 className="w-12 h-12 mx-auto text-cyan-500 animate-spin mb-4" />
                ) : (
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                )}
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {isProcessing ? 'Processing file...' : 'Drop your CSV file here'}
                </h4>
                <p className="text-gray-500 mb-4">or click to browse</p>
                <p className="text-sm text-gray-400">
                  Supported format: CSV with columns for first name, last name, date of birth
                </p>
              </div>
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Mapping Step */}
          {step === 'mapping' && parseResult && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{file?.name}</div>
                    <div className="text-sm text-gray-500">
                      {parseResult.totalRows} rows found, {parseResult.headers.length} columns
                    </div>
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-4">Map CSV Columns</h4>
              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-6">
                {mappings.map((mapping) => (
                  <div
                    key={mapping.csvColumn}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {mapping.csvColumn}
                      </div>
                      {mapping.sample && (
                        <div className="text-sm text-gray-500 truncate">
                          Sample: {mapping.sample}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <select
                      value={mapping.targetField || ''}
                      onChange={(e) =>
                        handleMappingChange(mapping.csvColumn, e.target.value as keyof Member)
                      }
                      className={`w-48 px-3 py-2 rounded-lg border text-sm ${
                        mapping.required && !mapping.targetField
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {targetFieldOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {!requiredFieldsMapped && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-800">Required fields not mapped</div>
                    <div className="text-sm text-amber-700">
                      Please map: First Name, Last Name, and Date of Birth
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!requiredFieldsMapped}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Validate & Preview
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Preview Step */}
          {step === 'preview' && validationResult && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Valid Rows</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {validationResult.validatedData.length}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Errors</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700">
                    {validationResult.errors.length}
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Warnings</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700">
                    {validationResult.warnings.length}
                  </div>
                </div>
              </div>

              {validationResult.errors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">
                    Errors (will not be imported)
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {validationResult.errors.slice(0, 10).map((err, i) => (
                      <div
                        key={i}
                        className="text-sm text-red-600 p-2 bg-red-50 rounded"
                      >
                        Row {err.row}: {err.message}
                        {err.value && ` (value: "${err.value}")`}
                      </div>
                    ))}
                    {validationResult.errors.length > 10 && (
                      <div className="text-sm text-red-500 p-2">
                        ... and {validationResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-amber-700 mb-2">
                    Warnings (will be imported with modifications)
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {validationResult.warnings.slice(0, 5).map((warn, i) => (
                      <div
                        key={i}
                        className="text-sm text-amber-600 p-2 bg-amber-50 rounded"
                      >
                        Row {warn.row}: {warn.message}
                      </div>
                    ))}
                    {validationResult.warnings.length > 5 && (
                      <div className="text-sm text-amber-500 p-2">
                        ... and {validationResult.warnings.length - 5} more warnings
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('mapping')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Mapping
                </button>
                <button
                  onClick={handleImport}
                  disabled={validationResult.validatedData.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Import {validationResult.validatedData.length} Members
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <Loader2 className="w-16 h-16 mx-auto text-cyan-500 animate-spin mb-6" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Importing Members...
              </h4>
              <p className="text-gray-500">
                Please wait while we process your data
              </p>
            </motion.div>
          )}

          {/* Complete Step */}
          {step === 'complete' && importResult && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8"
            >
              {importResult.success ? (
                <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-6" />
              ) : (
                <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-6" />
              )}
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {importResult.success ? 'Import Complete!' : 'Import Completed with Issues'}
              </h4>
              <p className="text-gray-500 mb-6">
                Successfully imported {importResult.successCount} of {importResult.totalProcessed}{' '}
                members
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-700">
                    {importResult.successCount}
                  </div>
                  <div className="text-sm text-emerald-600">Imported</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {importResult.failureCount}
                  </div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Import Another File
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
