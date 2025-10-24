import { useState } from 'react';
import { Building2, Users, Edit, Save, RotateCcw } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  parent_department_id?: string;
  is_active: boolean;
}

interface Employee {
  id: string;
  full_name: string;
  primary_department_id?: string;
  reports_to_id?: string;
  employment_status: string;
}

interface Relationship {
  id: string;
  parent_id: string;
  child_id: string;
}

interface Position {
  id: string;
  x: number;
  y: number;
}

interface InteractiveOrgChartProps {
  departments: Department[];
  employees: Employee[];
  relationships: Relationship[];
  positions: Position[];
  onPositionUpdate: (id: string, x: number, y: number) => void;
  isEditMode: boolean;
  onSaveLayout: () => Promise<boolean>;
  onResetLayout: () => Promise<boolean>;
  onDepartmentSelect: (departmentId: string) => void;
  searchTerm: string;
}

export default function InteractiveOrgChart({
  departments,
  employees,
  relationships,
  positions,
  onPositionUpdate,
  isEditMode,
  onSaveLayout,
  onResetLayout,
  onDepartmentSelect,
  searchTerm
}: InteractiveOrgChartProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      await onSaveLayout();
    } catch (error) {
      console.error('Failed to save layout:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetLayout = async () => {
    try {
      await onResetLayout();
    } catch (error) {
      console.error('Failed to reset layout:', error);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentEmployees = (departmentId: string) => {
    return employees.filter(emp => emp.primary_department_id === departmentId);
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-50 rounded-lg border border-slate-200 overflow-auto">
      {isEditMode && (
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          <button
            onClick={handleResetLayout}
            className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="flex items-center space-x-2 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Layout'}</span>
          </button>
        </div>
      )}

      <div className="p-6">
        {filteredDepartments.length === 0 && searchTerm ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No departments found</h3>
              <p className="text-slate-500">No departments match your search term "{searchTerm}"</p>
            </div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No organizational structure</h3>
              <p className="text-slate-500">Create departments to build your organizational chart</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredDepartments.map((dept) => {
              const departmentEmployees = getDepartmentEmployees(dept.id);

              return (
                <div
                  key={dept.id}
                  className={`bg-white p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    isEditMode ? 'border-dashed border-sky-300 hover:border-sky-500' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => onDepartmentSelect(dept.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{dept.name}</h3>
                        <p className="text-sm text-slate-500">
                          {departmentEmployees.length} employee{departmentEmployees.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dept.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {isEditMode && (
                        <Edit className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {departmentEmployees.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {departmentEmployees.slice(0, 6).map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-sky-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {emp.full_name}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                              {emp.employment_status}
                            </p>
                          </div>
                        </div>
                      ))}
                      {departmentEmployees.length > 6 && (
                        <div className="flex items-center justify-center p-3 bg-slate-100 rounded-lg">
                          <span className="text-sm text-slate-600">
                            +{departmentEmployees.length - 6} more
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}