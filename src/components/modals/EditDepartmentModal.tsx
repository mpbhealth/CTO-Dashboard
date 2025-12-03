import { useState, useEffect } from 'react';
import { X, Building2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Department, EmployeeProfile } from '../../hooks/useOrganizationalData';

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  department: Department | null;
  departments: Department[];
  employees: EmployeeProfile[];
}

export default function EditDepartmentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  department,
  departments,
  employees
}: EditDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    parent_department_id: '',
    department_lead_id: '',
    strategic_purpose: '',
    location: '',
    contact_email: '',
    mission_statement: '',
    key_objectives: '',
    tech_stack: '',
    reporting_frequency: 'weekly',
    budget_allocated: '',
    headcount: '0',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when department changes
  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        description: department.description || '',
        code: department.code || '',
        parent_department_id: department.parent_department_id || '',
        department_lead_id: department.department_lead_id || '',
        strategic_purpose: department.strategic_purpose || '',
        location: department.location || '',
        contact_email: department.contact_email || '',
        mission_statement: department.mission_statement || '',
        key_objectives: department.key_objectives?.join(', ') || '',
        tech_stack: department.tech_stack?.join(', ') || '',
        reporting_frequency: department.reporting_frequency || 'weekly',
        budget_allocated: department.budget_allocated?.toString() || '',
        headcount: department.headcount?.toString() || '0',
        is_active: department.is_active !== false
      });
      setError(null);
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.name.trim()) {
        setError('Department Name is required');
        setIsSubmitting(false);
        return;
      }

      const keyObjectivesArray = formData.key_objectives
        .split(',')
        .map(obj => obj.trim())
        .filter(obj => obj.length > 0);

      const techStackArray = formData.tech_stack
        .split(',')
        .map(tech => tech.trim())
        .filter(tech => tech.length > 0);

      const { error: updateError } = await supabase
        .from('departments')
        .update({
          name: formData.name.trim(),
          code: formData.code.trim() || null,
          description: formData.description || null,
          strategic_purpose: formData.strategic_purpose || null,
          location: formData.location || null,
          contact_email: formData.contact_email || null,
          mission_statement: formData.mission_statement || null,
          key_objectives: keyObjectivesArray.length > 0 ? keyObjectivesArray : null,
          tech_stack: techStackArray.length > 0 ? techStackArray : null,
          budget_allocated: formData.budget_allocated ? parseFloat(formData.budget_allocated) : null,
          headcount: parseInt(formData.headcount) || 0,
          parent_department_id: formData.parent_department_id || null,
          department_lead_id: formData.department_lead_id || null,
          reporting_frequency: formData.reporting_frequency || 'weekly',
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', department.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating department:', err);
      setError(err instanceof Error ? err.message : 'Failed to update department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (!isOpen || !department) return null;

  // Filter out current department from parent options to prevent circular reference
  const availableParentDepartments = departments.filter(d => d.id !== department.id);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Edit Department</h2>
              <p className="text-sm text-slate-500">{department.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <span className="w-1 h-5 bg-emerald-500 rounded-full mr-2"></span>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
                    Department Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="e.g., ENG, MKT, HR"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="parent_department_id" className="block text-sm font-medium text-slate-700 mb-1">
                    Parent Department
                  </label>
                  <select
                    id="parent_department_id"
                    name="parent_department_id"
                    value={formData.parent_department_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="">None (Top Level)</option>
                    {availableParentDepartments.map(dept => (
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
                    value={formData.department_lead_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="">Select Lead</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact & Location */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <span className="w-1 h-5 bg-teal-500 rounded-full mr-2"></span>
                Contact & Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="e.g., Floor 3, Building A"
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
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="department@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Budget & Headcount */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
                Budget & Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="budget_allocated" className="block text-sm font-medium text-slate-700 mb-1">
                    Budget Allocated ($)
                  </label>
                  <input
                    type="number"
                    id="budget_allocated"
                    name="budget_allocated"
                    value={formData.budget_allocated}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="100000"
                  />
                </div>

                <div>
                  <label htmlFor="headcount" className="block text-sm font-medium text-slate-700 mb-1">
                    Headcount
                  </label>
                  <input
                    type="number"
                    id="headcount"
                    name="headcount"
                    value={formData.headcount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="reporting_frequency" className="block text-sm font-medium text-slate-700 mb-1">
                    Reporting Frequency
                  </label>
                  <select
                    id="reporting_frequency"
                    name="reporting_frequency"
                    value={formData.reporting_frequency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Strategic Info */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <span className="w-1 h-5 bg-purple-500 rounded-full mr-2"></span>
                Strategic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="strategic_purpose" className="block text-sm font-medium text-slate-700 mb-1">
                    Strategic Purpose
                  </label>
                  <textarea
                    id="strategic_purpose"
                    name="strategic_purpose"
                    rows={2}
                    value={formData.strategic_purpose}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="mission_statement" className="block text-sm font-medium text-slate-700 mb-1">
                    Mission Statement
                  </label>
                  <textarea
                    id="mission_statement"
                    name="mission_statement"
                    rows={2}
                    value={formData.mission_statement}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="key_objectives" className="block text-sm font-medium text-slate-700 mb-1">
                    Key Objectives
                  </label>
                  <textarea
                    id="key_objectives"
                    name="key_objectives"
                    rows={2}
                    value={formData.key_objectives}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="Objective 1, Objective 2, Objective 3"
                  />
                  <p className="text-xs text-slate-500 mt-1">Separate multiple objectives with commas</p>
                </div>

                <div>
                  <label htmlFor="tech_stack" className="block text-sm font-medium text-slate-700 mb-1">
                    Tech Stack
                  </label>
                  <textarea
                    id="tech_stack"
                    name="tech_stack"
                    rows={2}
                    value={formData.tech_stack}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="React, Node.js, PostgreSQL"
                  />
                  <p className="text-xs text-slate-500 mt-1">Separate multiple technologies with commas</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Department is Active
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

