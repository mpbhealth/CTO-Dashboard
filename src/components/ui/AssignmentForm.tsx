import React, { useState } from 'react';
import { X, Plus, Calendar, User, Building, CheckSquare, Save } from 'lucide-react';
import { AssignmentStatus, AssignmentCreateData } from '../../types/Assignment';
import { useProjects } from '../../hooks/useSupabaseData';
import { supabase } from '../../lib/supabase';

interface AssignmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AssignmentCreateData) => Promise<void>;
}

export default function AssignmentForm({ 
  isOpen, 
  onClose, 
  onCreate
}: AssignmentFormProps) {
  const { data: projects } = useProjects();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as AssignmentStatus,
    project_id: '',
    due_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'todo', label: 'To Do', icon: CheckSquare, color: 'text-slate-600' },
    { value: 'in_progress', label: 'In Progress', icon: Calendar, color: 'text-amber-600' },
    { value: 'done', label: 'Done', icon: CheckSquare, color: 'text-emerald-600' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        title: formData.title,
        description: formData.description || undefined,
        project_id: formData.project_id || undefined,
        status: formData.status,
        due_date: formData.due_date || undefined
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        project_id: '',
        due_date: ''
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Create New Assignment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6 w-full">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Assignment Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base md:text-sm"
                placeholder="e.g., Review API documentation"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base md:text-sm"
                placeholder="Detailed description of the assignment..."
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-slate-700 mb-1">
                Project (Optional)
              </label>
              <select
                id="project_id"
                name="project_id"
                value={formData.project_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">No Project</option>
                {projects?.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-slate-700 mb-1">
                Due Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}