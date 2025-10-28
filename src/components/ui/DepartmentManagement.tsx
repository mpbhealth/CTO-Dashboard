import { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Department {
  id: string;
  name: string;
  headcount?: number;
  budget_allocated?: number;
  is_active?: boolean;
}

interface DepartmentManagementProps {
  departments: Department[];
  onEdit?: (department: Department) => void;
  onDelete?: (department: Department) => void;
  onAdd?: () => void;
}

export default function DepartmentManagement({
  departments,
  onEdit,
  onDelete,
  onAdd,
}: DepartmentManagementProps) {
  return (
    <div className="space-y-4">
      {onAdd && (
        <div className="flex justify-end">
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Headcount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {departments.map((dept) => (
              <motion.tr
                key={dept.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-900">
                    {dept.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">
                    {dept.headcount ?? 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">
                    {dept.budget_allocated
                      ? `$${dept.budget_allocated.toLocaleString()}`
                      : 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      dept.is_active !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {dept.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(dept)}
                        className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit department"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(dept)}
                        className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {departments.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500">No departments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
