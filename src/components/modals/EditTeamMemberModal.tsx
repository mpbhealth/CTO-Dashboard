import { useState, useEffect } from 'react';
import { X, UserCheck, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface EditTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: TeamMember | null;
}

export default function EditTeamMemberModal({ isOpen, onClose, onSuccess, member }: EditTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    team: '',
    status: 'Available' as 'Available' | 'In Meeting' | 'Focus Time' | 'Away',
    email: '',
    department: '',
    customDepartment: '',
    hire_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);

  const teams = [
    'Executive',
    'Engineering',
    'Frontend',
    'Backend',
    'Infrastructure',
    'AI & Automation',
    'Product',
    'Operations',
    'Compliance',
    'Design',
    'International',
    'Marketing',
    'Finance',
    'Legal',
    'HR',
    'Sales',
    'SaudeMAX',
    'Concierge',
    'Trading',
    'Health',
    'Insurance',
    'Mobile',
    'UX',
    'DevOps',
    'Content'
  ];

  const departments = [
    'Executive',
    'Engineering',
    'Product',
    'Operations',
    'Compliance',
    'Marketing',
    'Finance',
    'Legal',
    'HR',
    'Sales',
    'SaudeMAX',
    'Concierge',
    'International',
    'Health Technology',
    'Insurance Technology',
    'Fintech Innovation',
    'AI & Machine Learning',
    'Custom' // This will trigger the custom input
  ];

  useEffect(() => {
    if (member) {
      // Check if the member's department is in our predefined list
      const isCustomDepartment = !departments.includes(member.department) && member.department !== 'Custom';
      
      setFormData({
        name: member.name,
        role: member.role,
        team: member.team,
        status: member.status,
        email: member.email || '',
        department: isCustomDepartment ? 'Custom' : member.department,
        customDepartment: isCustomDepartment ? member.department : '',
        hire_date: member.hire_date || ''
      });
      
      setShowCustomDepartment(isCustomDepartment);
    }
  }, [member, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Use custom department if "Custom" is selected, otherwise use selected department
      const finalDepartment = formData.department === 'Custom' ? formData.customDepartment : formData.department;
      
      if (!finalDepartment.trim()) {
        throw new Error('Department is required');
      }

      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          name: formData.name,
          role: formData.role,
          team: formData.team,
          status: formData.status,
          email: formData.email || null,
          department: finalDepartment,
          hire_date: formData.hire_date || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Show/hide custom department input based on selection
    if (name === 'department') {
      setShowCustomDepartment(value === 'Custom');
      if (value !== 'Custom') {
        setFormData(prev => ({ ...prev, customDepartment: '' }));
      }
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Edit Team Member</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="e.g., John Smith"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div>
            <label htmlFor="team" className="block text-sm font-medium text-slate-700 mb-1">
              Team *
            </label>
            <select
              id="team"
              name="team"
              required
              value={formData.team}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">Select a team</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">
              Department *
            </label>
            <select
              id="department"
              name="department"
              required
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">Select a department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Custom Department Input */}
          {showCustomDepartment && (
            <div>
              <label htmlFor="customDepartment" className="block text-sm font-medium text-slate-700 mb-1">
                Custom Department Name *
              </label>
              <input
                type="text"
                id="customDepartment"
                name="customDepartment"
                required={showCustomDepartment}
                value={formData.customDepartment}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Enter custom department name"
              />
            </div>
          )}

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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="Available">Available</option>
              <option value="In Meeting">In Meeting</option>
              <option value="Focus Time">Focus Time</option>
              <option value="Away">Away</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="john@mpbhealth.com"
            />
          </div>

          <div>
            <label htmlFor="hire_date" className="block text-sm font-medium text-slate-700 mb-1">
              Hire Date
            </label>
            <input
              type="date"
              id="hire_date"
              name="hire_date"
              value={formData.hire_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating...' : 'Update Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}