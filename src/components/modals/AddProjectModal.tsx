import { useState } from 'react';
import { X, FolderPlus, Github, ExternalLink, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProjectModal({ isOpen, onClose, onSuccess }: AddProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Planning' as 'Planning' | 'Building' | 'Live',
    team: '',
    github_link: '',
    monday_link: '',
    website_url: '',
    progress: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statuses = ['Planning', 'Building', 'Live'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert team string to array
      const teamArray = formData.team
        .split(',')
        .map(member => member.trim())
        .filter(member => member.length > 0);

      const { error: insertError } = await supabase
        .from('projects')
        .insert([{
          name: formData.name,
          description: formData.description,
          status: formData.status,
          team: teamArray,
          github_link: formData.github_link || '',
          monday_link: formData.monday_link || '',
          website_url: formData.website_url || '',
          progress: formData.progress
        }]);

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'Planning',
        team: '',
        github_link: '',
        monday_link: '',
        website_url: '',
        progress: 0
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'progress' ? parseInt(value) || 0 : value 
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Add New Project</h2>
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
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base md:text-sm"
                placeholder="e.g., MPB Health APP Suite"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base md:text-sm"
                placeholder="Brief description of the project goals and features"
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
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="progress" className="block text-sm font-medium text-slate-700 mb-1">
                Progress (%)
              </label>
              <input
                type="number"
                id="progress"
                name="progress"
                min="0"
                max="100"
                value={formData.progress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="team" className="block text-sm font-medium text-slate-700 mb-1">
                Team Members
              </label>
              <input
                type="text"
                id="team"
                name="team"
                value={formData.team}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter team members separated by commas (e.g., Sarah Johnson, Michael Chen)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Separate multiple team members with commas
              </p>
            </div>

            <div>
              <label htmlFor="github_link" className="block text-sm font-medium text-slate-700 mb-1">
                GitHub Repository
              </label>
              <div className="relative">
                <Github className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  id="github_link"
                  name="github_link"
                  value={formData.github_link}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://github.com/mpbhealth/project-name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="monday_link" className="block text-sm font-medium text-slate-700 mb-1">
                Monday.com Project
              </label>
              <div className="relative">
                <ExternalLink className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  id="monday_link"
                  name="monday_link"
                  value={formData.monday_link}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://mpbhealth.monday.com/boards/PROJECT"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="website_url" className="block text-sm font-medium text-slate-700 mb-1">
                Project Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  id="website_url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://project.mpbhealth.com or https://yourproject.com"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Live website URL for the project (if available)
              </p>
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
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}