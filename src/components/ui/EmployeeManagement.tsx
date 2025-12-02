import { useState } from 'react';
import { Edit, Trash2, Plus, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department_id?: string;
  position?: string;
  hire_date?: string;
}

interface EmployeeManagementProps {
  employees: Employee[];
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onAdd?: () => void;
}

export default function EmployeeManagement({
  employees,
  onEdit,
  onDelete,
  onAdd,
}: EmployeeManagementProps) {
  return (
    <div className="space-y-4">
      {onAdd && (
        <div className="flex justify-end">
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Hire Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {employees.map((emp) => (
              <motion.tr
                key={emp.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-900">
                    {emp.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">
                    {emp.position || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {emp.email && (
                      <div className="flex items-center text-sm text-slate-600">
                        <Mail className="w-3 h-3 mr-1" />
                        {emp.email}
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center text-sm text-slate-600">
                        <Phone className="w-3 h-3 mr-1" />
                        {emp.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">
                    {emp.hire_date
                      ? new Date(emp.hire_date).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(emp)}
                        className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit employee"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(emp)}
                        className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete employee"
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

        {employees.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
}
