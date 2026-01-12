import { useState } from 'react';
import { X, Download, FileSpreadsheet, Calendar, User } from 'lucide-react';

interface FileViewerModalProps {
  file: {
    id: string;
    file_name: string;
    department: string;
    subdepartment?: string;
    row_count: number;
    uploaded_by: string;
    created_at: string;
    file_url?: string;
  };
  data: any[];
  onClose: () => void;
  onDownload: () => void;
}

export function FileViewerModal({ file, data, onClose, onDownload }: FileViewerModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentData = data.slice(startIdx, endIdx);

  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];

  const hiddenColumns = ['id', 'staging_id', 'upload_batch_id', 'org_id', 'uploaded_by', 'imported_at'];
  const columns = allColumns.filter(col => !hiddenColumns.includes(col));

  const getDepartmentBadgeColor = (dept: string) => {
    switch(dept?.toLowerCase()) {
      case 'sales':
      case 'sales-leads':
      case 'sales-cancelations':
        return 'bg-blue-100 text-blue-800';
      case 'concierge':
      case 'concierge-weekly':
      case 'concierge-daily':
      case 'concierge-after-hours':
        return 'bg-[#1a3d97] text-white';
      case 'finance':
        return 'bg-green-100 text-green-800';
      case 'operations':
        return 'bg-red-100 text-red-800';
      case 'saudemax':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1a3d97] to-[#00A896] rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{file.file_name}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(file.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {file.uploaded_by}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDepartmentBadgeColor(file.subdepartment || file.department)}`}>
                  {file.subdepartment ? file.subdepartment.replace('_', ' ').replace('-', ' ') : file.department}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                  {file.row_count} rows
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No data available
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b-2 border-gray-200"
                        >
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                          >
                            {row[col] !== null && row[col] !== undefined
                              ? String(row[col])
                              : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {startIdx + 1} to {Math.min(endIdx, data.length)} of {data.length} rows
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
