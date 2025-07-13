import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Edit, 
  Trash2, 
  Plus, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Building2,
  User,
  Badge,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { EmployeeProfile, Department } from '../../hooks/useOrganizationalData';
import { supabase } from '../../lib/supabase';
import AddEmployeeModal from '../modals/AddEmployeeModal';

interface EmployeeManagementProps {
  employees: EmployeeProfile[];
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
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || emp.primary_department_id === filterDepartment;
    const matchesStatus = filterStatus === 'all' || emp.employment_status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'No Department';
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  const getReportsToName = (reportsToId: string | null) => {
    if (!reportsToId) return null;
    const manager = employees.find(e => e.id === reportsToId);
    return manager ? `${manager.first_name} ${manager.last_name}` : null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'inactive':
        return 'bg-slate-100 text-slate-600';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'on_leave':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'full_time':
        return 'bg-blue-100 text-blue-800';
      case 'part_time':
        return 'bg-purple-100 text-purple-800';
      case 'contract':
        return 'bg-orange-100 text-orange-800';
      case 'intern':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const handleDeleteEmployee = async (emp: EmployeeProfile) => {
    if (window.confirm(`Are you sure you want to delete "${emp.first_name} ${emp.last_name}"? This action cannot be undone.`)) {
      setDeletingId(emp.id);
      try {
        const { error } = await supabase
          .from('employee_profiles')
          .delete()
          .eq('id', emp.id);

        if (error) throw error;
        onRefresh();
      } catch (err) {
        console.error('Error deleting employee:', err);
        alert('Failed to delete employee. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEditEmployee = (emp: EmployeeProfile) => {
    setSelectedEmployee(emp);
    setIsEditModalOpen(true);
  };

  const handleEditSelectedEmployee = () => {
    if (selectedEmployee) {
      // Pass the selected employee to the edit modal
      setSelectedEmployee(selectedEmployee);
      setIsEditModalOpen(true);
      setSelectedEmployee(null);
    }
  };

  const handleAddSuccess = () => {
    onRefresh();
  };

  // Format manager names for dropdown
  const getManagersList = () => {
    return employees.map(emp => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name} (${emp.title})`
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredEmployees.map((employee) => (
        <motion.div
          key={employee.id}
          layout
          className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setSelectedEmployee(employee)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-indigo-600">
                  {employee.first_name[0]}{employee.last_name[0]}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-sm text-slate-600">{employee.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEmployee(employee);
                }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit employee"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEmployee(employee);
                }}
                disabled={deletingId === employee.id}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete employee"
              >
                {deletingId === employee.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Department and Status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">
                {getDepartmentName(employee.primary_department_id)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.employment_status)}`}>
                {employee.employment_status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(employee.employment_type)}`}>
                {employee.employment_type.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{employee.email}</span>
            </div>
            
            {employee.phone && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{employee.phone}</span>
              </div>
            )}
            
            {employee.location && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span>{employee.location}</span>
              </div>
            )}
          </div>

          {/* Reports To */}
          {getReportsToName(employee.reports_to_id) && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>Reports to {getReportsToName(employee.reports_to_id)}</span>
              </div>
            </div>
          )}

          {/* Start Date */}
          {employee.start_date && (
            <div className="mt-2">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Started {formatDate(employee.start_date)}</span>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Employee</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Title</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Department</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Contact</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Start Date</th>
            <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {filteredEmployees.map((employee) => (
            <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-indigo-600">
                      {employee.first_name[0]}{employee.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-sm text-slate-600">{employee.employee_id}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">{employee.title}</td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {getDepartmentName(employee.primary_department_id)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.employment_status)}`}>
                    {employee.employment_status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(employee.employment_type)}`}>
                    {employee.employment_type.replace('_', ' ')}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-900">{employee.email}</p>
                  {employee.phone && (
                    <p className="text-sm text-slate-600">{employee.phone}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {formatDate(employee.start_date)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setSelectedEmployee(employee)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditEmployee(employee)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit employee"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(employee)}
                    disabled={deletingId === employee.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete employee"
                  >
                    {deletingId === employee.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Employee Management</h2>
          <p className="text-sm text-slate-600 mt-1">Manage employee profiles, assignments, and organizational relationships</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            {viewMode === 'grid' ? <Users className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            <span>{viewMode === 'grid' ? 'Table View' : 'Grid View'}</span>
          </button>
          
          <button className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <div className="text-sm text-slate-600">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200">
        {viewMode === 'grid' ? renderGridView() : renderTableView()}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">
            {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
              ? 'No employees match your current filters.' 
              : 'No employees found.'
            }
          </p>
          <p className="text-sm text-slate-500 mb-4">
            {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first employee.'
            }
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-semibold text-indigo-600">
                      {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </h3>
                    <p className="text-slate-600">{selectedEmployee.title}</p>
                    <p className="text-sm text-slate-500">{selectedEmployee.employee_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <Plus className="w-5 h-5 text-slate-400 transform rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Personal Information</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-600">Email:</span>
                      <p className="text-slate-900">{selectedEmployee.email}</p>
                    </div>
                    {selectedEmployee.phone && (
                      <div>
                        <span className="text-slate-600">Phone:</span>
                        <p className="text-slate-900">{selectedEmployee.phone}</p>
                      </div>
                    )}
                    {selectedEmployee.location && (
                      <div>
                        <span className="text-slate-600">Location:</span>
                        <p className="text-slate-900">{selectedEmployee.location}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment Details */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Employment Details</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-600">Department:</span>
                      <p className="text-slate-900">{getDepartmentName(selectedEmployee.primary_department_id)}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Status:</span>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEmployee.employment_status)}`}>
                          {selectedEmployee.employment_status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600">Type:</span>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(selectedEmployee.employment_type)}`}>
                          {selectedEmployee.employment_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {selectedEmployee.start_date && (
                      <div>
                        <span className="text-slate-600">Start Date:</span>
                        <p className="text-slate-900">{formatDate(selectedEmployee.start_date)}</p>
                      </div>
                    )}
                    {getReportsToName(selectedEmployee.reports_to_id) && (
                      <div>
                        <span className="text-slate-600">Reports To:</span>
                        <p className="text-slate-900">{getReportsToName(selectedEmployee.reports_to_id)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills and Certifications */}
              {(selectedEmployee.skills?.length || selectedEmployee.certifications?.length) && (
                <div className="mt-6">
                  <h4 className="font-medium text-slate-900 mb-3">Skills & Certifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedEmployee.skills?.length && (
                      <div>
                        <span className="text-sm text-slate-600 mb-2 block">Skills:</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedEmployee.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedEmployee.certifications?.length && (
                      <div>
                        <span className="text-sm text-slate-600 mb-2 block">Certifications:</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedEmployee.certifications.map((cert, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleEditSelectedEmployee();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    Edit Employee
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Edit Employee</h2>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedEmployee(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Handle employee update here
              setIsEditModalOpen(false);
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    defaultValue={selectedEmployee.first_name}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    defaultValue={selectedEmployee.last_name}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    defaultValue={selectedEmployee.email}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    defaultValue={selectedEmployee.title}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        departments={departments}
        managers={getManagersList()}
      />
    </div>
  );
}