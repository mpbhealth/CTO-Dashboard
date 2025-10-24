import { useState } from 'react';
import {
  Users,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from 'lucide-react';

interface Employee {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  primary_department_id?: string;
  reports_to_id?: string;
  employment_status: string;
  hire_date?: string;
  job_title?: string;
  created_at?: string;
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

interface EmployeeManagementProps {
  employees: Employee[];
  departments: Department[];
  onRefresh: () => void;
  searchTerm: string;
}

export default function EmployeeManagement({
  employees,
  departments,
  onRefresh,
  searchTerm
}: EmployeeManagementProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm === '' ||
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.job_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || emp.employment_status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || emp.primary_department_id === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'Unassigned';
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return null;
    const manager = employees.find(emp => emp.id === managerId);
    return manager?.full_name || 'Unknown Manager';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'inactive':
      case 'terminated':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'inactive':
        return 'bg-slate-100 text-slate-600';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const toggleSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const uniqueStatuses = Array.from(new Set(employees.map(emp => emp.employment_status)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Employee Management</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage employee profiles and organizational assignments
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status} className="capitalize">
                {status}
              </option>
            ))}
          </select>
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        {(statusFilter !== 'all' || departmentFilter !== 'all') && (
          <button
            onClick={() => {
              setStatusFilter('all');
              setDepartmentFilter('all');
            }}
            className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedEmployees.length > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-sky-900">
                {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-sm text-sky-700 hover:text-sky-900 transition-colors">
                Export Selected
              </button>
              <button className="text-sm text-amber-600 hover:text-amber-800 transition-colors">
                Bulk Update
              </button>
              <button className="text-sm text-red-600 hover:text-red-800 transition-colors">
                Archive Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
              ? 'No employees found'
              : 'No employees'
            }
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
              ? 'No employees match your current filters'
              : 'Get started by adding your first employee'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Header */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                onChange={handleSelectAll}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <div className="grid grid-cols-7 gap-4 flex-1 text-sm font-medium text-slate-600">
                <div>Employee</div>
                <div>Department</div>
                <div>Manager</div>
                <div>Status</div>
                <div>Hire Date</div>
                <div>Contact</div>
                <div>Actions</div>
              </div>
            </div>
          </div>

          {/* Employee List */}
          {filteredEmployees.map((emp) => {
            const managerName = getManagerName(emp.reports_to_id);

            return (
              <div
                key={emp.id}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={() => toggleSelection(emp.id)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div className="grid grid-cols-7 gap-4 flex-1">
                    {/* Employee Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{emp.full_name}</h3>
                        {emp.job_title && (
                          <p className="text-sm text-slate-500">{emp.job_title}</p>
                        )}
                      </div>
                    </div>

                    {/* Department */}
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">
                        {getDepartmentName(emp.primary_department_id)}
                      </span>
                    </div>

                    {/* Manager */}
                    <div className="flex items-center">
                      {managerName ? (
                        <span className="text-sm text-slate-700">{managerName}</span>
                      ) : (
                        <span className="text-sm text-slate-400">No manager</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(emp.employment_status)
                      }`}>
                        {getStatusIcon(emp.employment_status)}
                        <span className="ml-1 capitalize">{emp.employment_status}</span>
                      </span>
                    </div>

                    {/* Hire Date */}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        {emp.hire_date
                          ? new Date(emp.hire_date).toLocaleDateString()
                          : 'Unknown'
                        }
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="flex items-center space-x-2">
                      {emp.email && (
                        <Mail className="w-4 h-4 text-slate-400" />
                      )}
                      {emp.phone && (
                        <Phone className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-sm text-slate-700 truncate">
                        {emp.email || emp.phone || 'No contact'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end">
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === emp.id ? null : emp.id)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>

                        {showDropdown === emp.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                            <div className="py-1">
                              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                                <Edit className="w-4 h-4" />
                                <span>Edit Employee</span>
                              </button>
                              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                                <Mail className="w-4 h-4" />
                                <span>Send Email</span>
                              </button>
                              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
                                <Trash2 className="w-4 h-4" />
                                <span>Archive Employee</span>
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