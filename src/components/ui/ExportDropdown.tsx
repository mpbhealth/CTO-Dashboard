import { useState } from 'react';
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportDropdownProps {
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onExportJSON?: () => void;
}

export default function ExportDropdown({
  onExportCSV,
  onExportPDF,
  onExportExcel,
  onExportJSON,
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions = [
    { label: 'Export as CSV', icon: Table, onClick: onExportCSV, format: 'csv' },
    { label: 'Export as PDF', icon: FileText, onClick: onExportPDF, format: 'pdf' },
    { label: 'Export as Excel', icon: FileSpreadsheet, onClick: onExportExcel, format: 'xlsx' },
    { label: 'Export as JSON', icon: FileText, onClick: onExportJSON, format: 'json' },
  ].filter(option => option.onClick);

  if (exportOptions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20"
            >
              {exportOptions.map((option) => (
                <button
                  key={option.format}
                  onClick={() => {
                    option.onClick?.();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left"
                >
                  <option.icon className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">{option.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
