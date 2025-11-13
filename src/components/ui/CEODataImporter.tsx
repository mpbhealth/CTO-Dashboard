import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CEODataImporterProps {
  onImport: (file: File) => Promise<void> | void;
  acceptedFormats?: string[];
  maxSize?: number;
}

export function CEODataImporter({
  onImport,
  acceptedFormats = ['.csv', '.xlsx', '.json'],
  maxSize = 10 * 1024 * 1024,
}: CEODataImporterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      setStatus('error');
      setMessage(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
      return;
    }

    setSelectedFile(file);
    setStatus('idle');
    setMessage('');
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setIsImporting(true);
      setStatus('idle');
      await onImport(selectedFile);
      setStatus('success');
      setMessage('Data imported successfully');
      setTimeout(() => {
        setSelectedFile(null);
        setStatus('idle');
        setMessage('');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md border border-slate-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Import Data</h3>
          <p className="text-sm text-slate-600">
            Upload files to import data. Accepted formats: {acceptedFormats.join(', ')}
          </p>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
          {!selectedFile ? (
            <div className="text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept={acceptedFormats.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="text-sm text-slate-700">
                  Click to select a file or drag and drop
                </span>
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-pink-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setStatus('idle');
                    setMessage('');
                  }}
                  className="p-1 hover:bg-slate-100 rounded"
                  disabled={isImporting}
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 text-emerald-600"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">{message}</span>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 text-red-600"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{message}</span>
                </motion.div>
              )}

              <button
                onClick={handleImport}
                disabled={isImporting || status === 'success'}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isImporting ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CEODataImporter;
