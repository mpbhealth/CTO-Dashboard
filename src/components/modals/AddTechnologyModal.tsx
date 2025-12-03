import { useState } from 'react';
import { X, Server, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { handleError } from '../../lib/errorHandler';

interface AddTechnologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTechnologyModal({ isOpen, onClose, onSuccess }: AddTechnologyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    version: '',
    owner: '',
    status: 'Active' as 'Active' | 'Experimental' | 'Deprecated',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'Frontend Framework',
    'Frontend Language',
    'Frontend Styling',
    'Frontend Build Tool',
    'Backend Framework',
    'Backend Language',
    'Backend as a Service',
    'Database',
    'CI/CD',
    'Containerization',
    'Hosting Platform',
    'CMS',
    'AI Service',
    'Automation Platform',
    'Form Builder',
    'Trading Platform',
    'Payment Processing',
    'Analytics',
    'Monitoring',
    'Communication',
    'Other'
  ];

  const owners = [
    'Frontend Team',
    'Backend Team',
    'DevOps Team',
    'AI Team',
    'Content Team',
    'Operations Team',
    'Marketing Team',
    'Finance Team',
    'All Teams',
    'Vinnie R. Tannous',
    'Legacy Team'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('tech_stack')
        .insert([{
          name: formData.name,
          category: formData.category,
          version: formData.version,
          owner: formData.owner,
          status: formData.status,
          notes: formData.notes
        }]);

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        name: '',
        category: '',
        version: '',
        owner: '',
        status: 'Active',
        notes: ''
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(handleError('AddTechnologyModal', err));
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Add Technology</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 w-full">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Technology Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500 text-base md:text-sm"
              placeholder="e.g., React, Node.js, PostgreSQL"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500 text-base md:text-sm"
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="version" className="block text-sm font-medium text-slate-700 mb-1">
              Version *
            </label>
            <input
              type="text"
              id="version"
              name="version"
              required
              value={formData.version}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500"
              placeholder="e.g., 18.3.1, v5, 2024.1"
            />
          </div>

          <div>
            <label htmlFor="owner" className="block text-sm font-medium text-slate-700 mb-1">
              Owner *
            </label>
            <select
              id="owner"
              name="owner"
              required
              value={formData.owner}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500"
            >
              <option value="">Select an owner</option>
              {owners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500"
            >
              <option value="Active">Active</option>
              <option value="Experimental">Experimental</option>
              <option value="Deprecated">Deprecated</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500"
              placeholder="Additional notes about this technology..."
            />
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
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Technology'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}