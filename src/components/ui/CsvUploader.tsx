import { useState } from 'react';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';

interface CsvUploaderProps {
  onDataParsed: (data: any[]) => void;
  acceptedColumns?: string[];
  label?: string;
}

export default function CsvUploader({ onDataParsed, acceptedColumns, label = "Upload CSV" }: CsvUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing error: ${results.errors[0].message}`);
          setLoading(false);
          return;
        }

        if (acceptedColumns && results.data.length > 0) {
          const fileColumns = Object.keys(results.data[0] as any);
          const missingColumns = acceptedColumns.filter(col => !fileColumns.includes(col));

          if (missingColumns.length > 0) {
            setError(`Missing required columns: ${missingColumns.join(', ')}`);
            setLoading(false);
            return;
          }
        }

        onDataParsed(results.data);
        setLoading(false);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
        setLoading(false);
      }
    });
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg cursor-pointer hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">{loading ? 'Processing...' : 'Choose CSV File'}</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </label>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
