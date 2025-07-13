import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportData, ExportData } from '../../utils/exportUtils';

interface ExportDropdownProps {
  data: ExportData;
  className?: string;
}

export default function ExportDropdown({ data, className = '' }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportOptions = [
    {
      format: 'csv' as const,
      label: 'Export as CSV',
      icon: FileSpreadsheet,
      description: 'Comma-separated values for Excel',
      color: 'text-emerald-600'
    },
    {
      format: 'pdf' as const,
      label: 'Export as PDF',
      icon: FileText,
      description: 'Formatted PDF document',
      color: 'text-red-600'
    },
    {
      format: 'word' as const,
      label: 'Export as Word',
      icon: File,
      description: 'Microsoft Word document',
      color: 'text-blue-600'
    }
  ];

  const handleExport = async (format: 'csv' | 'pdf' | 'word') => {
    setIsExporting(format);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      exportData(data, format);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden"
            >
              <div className="p-2">
                {exportOptions.map((option) => {
                  const Icon = option.icon;
                  const isCurrentlyExporting = isExporting === option.format;
                  
                  return (
                    <button
                      key={option.format}
                      onClick={() => handleExport(option.format)}
                      disabled={isCurrentlyExporting}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center ${option.color}`}>
                        {isCurrentlyExporting ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                <p className="text-xs text-slate-600">
                  <strong>Records:</strong> {data.data?.length || 0} items
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}