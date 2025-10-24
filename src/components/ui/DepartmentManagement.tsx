import { useState } from 'react';
import {
  Building2,
  Users,
  Edit,
  Trash2,
  Plus,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  parent_department_id?: string;
  is_active: boolean;
  description?: string;
  created_at?: string;
}

interface Employee {
  id: string;
  full_name: string;
  primary_department_id?: string;
  employment_status: string;
}

interface DepartmentManagementProps {
  departments: Department[];
  employees: Employee[];
  onRefresh: () => void;
  onDeleteCheck: (departmentId: string) => Promise<boolean>;
  searchTerm: string;
  onAddDepartment: () => void;
}

export default function DepartmentManagement({
  departments,
  employees,
  onRefresh,
  onDeleteCheck,
  searchTerm,
  onAddDepartment
}: DepartmentManagementProps) {
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentEmployees = (departmentId: string) => {
    return employees.filter(emp => emp.primary_department_id === departmentId);
  };

  const getParentDepartment = (parentId?: string) => {
    return parentId ? departments.find(dept => dept.id === parentId) : null;
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
      const canDelete = await onDeleteCheck(departmentId);
      if (canDelete) {
        // This would typically call a delete function
        console.log('Deleting department:', departmentId);
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedDepartments.length === filteredDepartments.length) {
      setSelectedDepartments([]);
    } else {
      setSelectedDepartments(filteredDepartments.map(dept => dept.id));
    }
  };

  const toggleSelection = (departmentId: string) => {
    setSelectedDepartments(prev =>
      prev.includes(departmentId)
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Department Management</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage departments and their organizational structure
          </p>
        </div>
        <button
          onClick={onAddDepartment}
          className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedDepartments.length > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-sky-900">
                {selectedDepartments.length} department{selectedDepartments.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-sm text-sky-700 hover:text-sky-900 transition-colors">
                Export Selected
              </button>
              <button className="text-sm text-red-600 hover:text-red-800 transition-colors">
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchTerm ? 'No departments found' : 'No departments'}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm
              ? `No departments match your search for "${searchTerm}"`
              : 'Get started by creating your first department'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={onAddDepartment}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Department</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Header */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedDepartments.length === filteredDepartments.length}
                onChange={handleSelectAll}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <div className="grid grid-cols-6 gap-4 flex-1 text-sm font-medium text-slate-600">
                <div>Department</div>
                <div>Parent Department</div>
                <div>Employees</div>
                <div>Status</div>
                <div>Created</div>
                <div>Actions</div>
              </div>
            </div>
          </div>

          {/* Department List */}
          {filteredDepartments.map((dept) => {
            const departmentEmployees = getDepartmentEmployees(dept.id);
            const parentDept = getParentDepartment(dept.parent_department_id);

            return (
              <div
                key={dept.id}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes(dept.id)}
                    onChange={() => toggleSelection(dept.id)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div className="grid grid-cols-6 gap-4 flex-1">
                    {/* Department Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{dept.name}</h3>
                        {dept.description && (
                          <p className="text-sm text-slate-500 truncate max-w-48">
                            {dept.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Parent Department */}
                    <div className="flex items-center">
                      {parentDept ? (
                        <span className="text-sm text-slate-700">{parentDept.name}</span>
                      ) : (
                        <span className="text-sm text-slate-400">Root Department</span>
                      )}
                    </div>

                    {/* Employees Count */}
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">
                        {departmentEmployees.length}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        dept.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {dept.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center">
                      <span className="text-sm text-slate-500">
                        {dept.created_at
                          ? new Date(dept.created_at).toLocaleDateString()
                          : 'Unknown'
                        }
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end">
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === dept.id ? null : dept.id)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>

                        {showDropdown === dept.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                            <div className="py-1">
                              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                                <Edit className="w-4 h-4" />
                                <span>Edit Department</span>
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Department</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(null)}
        />
      )}
    </div>
  );
}