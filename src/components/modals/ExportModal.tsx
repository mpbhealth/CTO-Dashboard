import { useState } from 'react';
import { X, Download, FileText, Table, FileSpreadsheet } from 'lucide-react';

interface ExportModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  rows: any[];
  defaultFilename?: string;
  title?: string;
}

export function ExportModal({ open, setOpen, rows, defaultFilename = 'export', title = 'Export Data' }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [filename, setFilename] = useState(defaultFilename);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (format) {
        case 'csv': {
          if (rows.length === 0) {
            throw new Error('No data to export');
          }
          const headers = Object.keys(rows[0]);
          const csvHeaders = headers.join(',');
          const csvRows = rows.map(row =>
            headers.map(header => {
              const value = row[header];
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          );
          content = [csvHeaders, ...csvRows].join('\n');
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        }
        case 'json': {
          content = JSON.stringify(rows, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;
        }
        case 'pdf': {
          alert('PDF export requires server-side processing. Use CSV or JSON for now.');
          setBusy(false);
          return;
        }
        default:
          throw new Error('Unsupported format');
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setOpen(false);
    } catch (error: any) {
      alert(error.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="opacity-70 hover:opacity-100" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFormat('csv')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  format === 'csv'
                    ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Table size={20} />
                <span className="text-xs font-medium">CSV</span>
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  format === 'json'
                    ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet size={20} />
                <span className="text-xs font-medium">JSON</span>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  format === 'pdf'
                    ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText size={20} />
                <span className="text-xs font-medium">PDF</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter filename"
            />
          </div>

          <div className="text-sm text-gray-500">
            <p>Exporting {rows.length} row(s)</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
            onClick={handleExport}
            disabled={busy || rows.length === 0}
          >
            <Download size={18} />
            {busy ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
