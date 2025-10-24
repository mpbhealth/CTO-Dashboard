import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { postExport } from '../../lib/exportClient';

interface ExportDropdownProps {
  data: any[];
  filename?: string;
  sheetName?: string;
}

export default function ExportDropdown({ data, filename, sheetName }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleExport(format: 'csv' | 'xlsx') {
    setLoading(true);
    try {
      await postExport(format, data, filename, sheetName);
    } catch (error) {
      console.error('Export failed:', error);
      alert(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        <span>{loading ? 'Exporting...' : 'Export'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10">
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Export as CSV</span>
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Export as Excel</span>
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
