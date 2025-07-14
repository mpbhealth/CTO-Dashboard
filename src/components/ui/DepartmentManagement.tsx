import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2,
  Users,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  MapPin,
  Mail,
  Target,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  X
} from 'lucide-react';
import { Department, EmployeeProfile } from '../../hooks/useOrganizationalData';
import { supabase } from '../../lib/supabase';

interface DepartmentManagementProps {
  departments: Department[];
  employees: EmployeeProfile[];
  onRefresh: () => void;
  searchTerm: string;
  onDeleteCheck?: (departmentId: string) => Promise<boolean>;
  onAddDepartment?: () => void;
}

export default function DepartmentManagement({ 
  departments, 
  employees, 
  onRefresh, 
  searchTerm,
  onDeleteCheck,
  onAddDepartment
}: DepartmentManagementProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategic_purpose: '',
    parent_department_id: '',
    department_lead_id: '',
    location: '',
    contact_email: '',
    mission_statement: '',
    key_objectives: '',
    tech_stack: '',
    budget_allocated: '',
    is_active: true
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'employees' | 'budget'>('name');

  // Filter departments
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && dept.is_active) ||
                         (filterStatus === 'inactive' && !dept.is_active);
    return matchesSearch && matchesFilter;
  });

  // Sort departments
  const sortedDepartments = [...filteredDepartments].sort((a, b) => {
    switch (sortBy) {
      case 'employees':
        const aCount = employees.filter(e => e.primary_department_id === a.id).length;
        const bCount = employees.filter(e => e.primary_department_id === b.id).length;
        return bCount - aCount;
      case 'budget':
        return (b.budget_allocated || 0) - (a.budget_allocated || 0);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const getDepartmentEmployeeCount = (departmentId: string) => {
    return employees.filter(emp => emp.primary_department_id === departmentId).length;
  };

  const getDepartmentLead = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    if (!dept?.department_lead_id) return null;
    return employees.find(emp => emp.user_id === dept.department_lead_id);
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (window.confirm(`Are you sure you want to delete "${dept.name}"? This action cannot be undone.`)) {
      // Additional validation from parent component
      if (onDeleteCheck) {
        const canDelete = await onDeleteCheck(dept.id);
        if (!canDelete) return;
      }
      
      setDeletingId(dept.id);
      try {
        const { error } = await supabase
          .from('departments')
          .delete()
          .eq('id', dept.id);

        if (error) throw error;
        onRefresh();
      } catch (err) {
        console.error('Error deleting department:', err);
        alert('Failed to delete department. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEditDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    // Handle array data for editing
    const keyObjectives = Array.isArray(dept.key_objectives) ? dept.key_objectives.join(', ') : '';
    const techStack = Array.isArray(dept.tech_stack) ? dept.tech_stack.join(', ') : '';
    
    setFormData({
      name: dept.name || '',
      description: dept.description || '',
      strategic_purpose: dept.strategic_purpose || '',
      parent_department_id: dept.parent_department_id || '',
      department_lead_id: dept.department_lead_id || '',
      location: dept.location || '',
      contact_email: dept.contact_email || '',
      mission_statement: dept.mission_statement || '',
      key_objectives: keyObjectives,
      tech_stack: techStack,
      budget_allocated: dept.budget_allocated ? String(dept.budget_allocated) : '',
      is_active: dept.is_active !== null ? dept.is_active : true
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;
    
    setIsSubmitting(true);
    setFormError(null);
    
    // Basic validation
    if (!formData.name.trim()) {
      setFormError('Error: A department cannot be its own parent');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Process array fields
      const keyObjectives = formData.key_objectives
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const techStack = formData.tech_stack
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      // Validate parent department (prevent circular reference)
      if (formData.parent_department_id === selectedDepartment.id) {
        setFormError('A department cannot be its own parent');
        setIsSubmitting(false);
        return;
      }
      
      // Check for circular parent references
      if (formData.parent_department_id) {
        let parentId = formData.parent_department_id;
        const visited = new Set();
        let foundCircular = false;
        
        while (parentId) {
          if (visited.has(parentId)) {
            setFormError('Error: Circular department reference detected');
            setIsSubmitting(false);
            foundCircular = true;
            return;
          }
          
          visited.add(parentId);
          const parent = departments.find(d => d.id === parentId);
          parentId = parent?.parent_department_id || null;
          
          // If we've reached a department that would make our selected department its parent,
          // that would create a cycle when we update
          if (parentId === selectedDepartment.id) {
            setFormError('Error: Circular department reference detected');
            setIsSubmitting(false);
            foundCircular = true;
            return;
          }
        }
        
        if (foundCircular) return;
      }
      
      // Prepare update data with proper null handling
      const updateData = {
        name: formData.name.trim(),
        description: formData.description || null,
        strategic_purpose: formData.strategic_purpose || null,
        parent_department_id: formData.parent_department_id || null,
        department_lead_id: formData.department_lead_id || null,
        location: formData.location || null,
        contact_email: formData.contact_email || null,
        mission_statement: formData.mission_statement || null,
        key_objectives: keyObjectives.length > 0 ? keyObjectives : null,
        tech_stack: techStack.length > 0 ? techStack : null,
        budget_allocated: formData.budget_allocated ? parseFloat(formData.budget_allocated) : null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };
      
      // Check for duplicate name (but not with the current department)
      const { data: existingDept, error: nameCheckError } = await supabase
        .from('departments')
        .select('id')
        .eq('name', updateData.name)
        .neq('id', selectedDepartment.id);
        
      if (nameCheckError) throw nameCheckError;
      
      if (existingDept && existingDept.length > 0) {
        setFormError('Error: A department with this name already exists');
        setIsSubmitting(false);
        return;
      }
      
      // Proceed with the update
      const { error: updateError } = await supabase
        .from('departments')
        .update(updateData)
        .eq('id', selectedDepartment.id);
        
      if (updateError) throw updateError;
      
      // Then refresh data
      await onRefresh();
      
      // Close the modal after successful update
      setIsEditModalOpen(false);
      setSelectedDepartment(null);
      setFormError(null);
    } catch (err) {
      console.error('Error updating department:', err);
      if (err instanceof Error) {
        setFormError(`Update failed: ${err.message}`);
      } else {
        setFormError('An error occurred while updating the department. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Department Management</h2>
          <p className="text-sm text-slate-600 mt-1">Manage department structure, leads, and organizational hierarchy</p>
        </div>
        <div className="flex items-center">
          <button
            onClick={onAddDepartment}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="all">All Departments</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="employees">Sort by Team Size</option>
            <option value="budget">Sort by Budget</option>
          </select>
        </div>

        <div className="text-sm text-slate-600">
          Showing {sortedDepartments.length} of {departments.length} departments
        </div>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedDepartments.map((department) => {
          const employeeCount = getDepartmentEmployeeCount(department.id);
          const departmentLead = getDepartmentLead(department.id);
          
          return (
            <motion.div
              key={department.id}
              layout
              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    department.is_active ? 'bg-indigo-100' : 'bg-slate-100'
                  }`}>
                    <Building2 className={`w-6 h-6 ${
                      department.is_active ? 'text-indigo-600' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{department.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        department.is_active 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {department.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEditDepartment(department)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit department"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDepartment(department);
                    }}
                    disabled={deletingId === department.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete department"
                  >
                    {deletingId === department.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Description */}
              {department.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {department.description}
                </p>
              )}

              {/* Strategic Purpose */}
              {department.strategic_purpose && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-slate-700">Strategic Purpose</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {department.strategic_purpose}
                  </p>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-xs text-slate-600">Team Size</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{employeeCount}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    <span className="text-xs text-slate-600">Budget</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {department.budget_allocated 
                      ? `$${(department.budget_allocated / 1000).toFixed(0)}K`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {/* Department Lead */}
              {departmentLead && (
                <div className="mb-4">
                  <span className="text-xs font-medium text-slate-700 mb-2 block">Department Lead</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">
                        {departmentLead.first_name[0]}{departmentLead.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {departmentLead.first_name} {departmentLead.last_name}
                      </p>
                      <p className="text-xs text-slate-600">{departmentLead.title}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-2">
                {department.contact_email && (
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{department.contact_email}</span>
                  </div>
                )}
                
                {department.location && (
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>{department.location}</span>
                  </div>
                )}

                {department.reporting_frequency && (
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>Reports {department.reporting_frequency}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Updated {new Date(department.updated_at).toLocaleDateString()}
                  </span>
                  <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedDepartments.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">
            {searchTerm || filterStatus !== 'all' 
              ? 'No departments match your current filters.' 
              : 'No departments found.'
            }
          </p>
          <p className="text-sm text-slate-500 mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first department.'
            }
          </p>
          <button
            onClick={onAddDepartment}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      )}

      {/* Edit Department Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setIsEditModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Edit Department: {selectedDepartment?.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedDepartment(null);
                  setFormError(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div> 
            
            <form onSubmit={handleUpdateDepartment} className="p-6 space-y-6"> 
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="parent_department_id" className="block text-sm font-medium text-slate-700 mb-1">
                    Parent Department
                  </label>
                  <select
                    id="parent_department_id"
                    name="parent_department_id"
                    value={formData.parent_department_id || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">No Parent Department</option>
                    {departments.filter(d => d.id !== selectedDepartment?.id).map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="department_lead_id" className="block text-sm font-medium text-slate-700 mb-1">
                    Department Lead
                  </label>
                  <select
                    id="department_lead_id"
                    name="department_lead_id"
                    value={formData.department_lead_id || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Select Department Lead</option>
                    {employees
                      .filter(emp => emp.employment_status === 'active' && emp.user_id)
                      .map(emp => (
                      <option key={emp.id} value={emp.user_id}>
                        {emp.first_name} {emp.last_name} - {emp.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="budget_allocated" className="block text-sm font-medium text-slate-700 mb-1">
                    Budget Allocated
                  </label>
                  <input
                    type="number"
                    id="budget_allocated"
                    name="budget_allocated"
                    value={formData.budget_allocated}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="contact_email" className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                      Active Department
                    </label>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="strategic_purpose" className="block text-sm font-medium text-slate-700 mb-1">
                    Strategic Purpose
                  </label>
                  <textarea
                    id="strategic_purpose"
                    name="strategic_purpose"
                    rows={3}
                    value={formData.strategic_purpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="mission_statement" className="block text-sm font-medium text-slate-700 mb-1">
                    Mission Statement
                  </label>
                  <textarea
                    id="mission_statement"
                    name="mission_statement"
                    rows={3}
                    value={formData.mission_statement}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="key_objectives" className="block text-sm font-medium text-slate-700 mb-1">
                    Key Objectives
                  </label>
                  <input
                    type="text"
                    id="key_objectives"
                    name="key_objectives"
                    value={formData.key_objectives}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Separate objectives with commas"
                  />
                </div>
                
                <div>
                  <label htmlFor="tech_stack" className="block text-sm font-medium text-slate-700 mb-1">
                    Tech Stack
                  </label>
                  <input
                    type="text"
                    id="tech_stack"
                    name="tech_stack"
                    value={formData.tech_stack}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Separate technologies with commas"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedDepartment(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
                  disabled={!selectedDepartment}
                >
                  {isSubmitting ? 'Updating...' : 'Update Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{departments.length}</p>
          <p className="text-sm text-slate-600">Total Departments</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {departments.filter(d => d.is_active).length}
          </p>
          <p className="text-sm text-slate-600">Active</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
          <p className="text-sm text-slate-600">Total Employees</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-indigo-600">
            ${departments.reduce((sum, d) => sum + (d.budget_allocated || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-600">Total Budget</p>
        </div>
      </div>
    </div>
  );
}