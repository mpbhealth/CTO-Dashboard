import { useState, useEffect } from 'react';
import { X, Link2, Save, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QuickLink {
  id: string;
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  category: string | null;
  click_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface EditQuickLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (link: QuickLink) => void;
  link: QuickLink;
  existingCategories: string[];
}

export default function EditQuickLinkModal({
  isOpen,
  onClose,
  onSuccess,
  link,
  existingCategories
}: EditQuickLinkModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    icon: '',
    category: '',
    customCategory: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  // Populate form data when link changes
  useEffect(() => {
    if (link) {
      setFormData({
        name: link.name || '',
        description: link.description || '',
        url: link.url || '',
        icon: link.icon || '',
        category: link.category || '',
        customCategory: ''
      });
    }
  }, [link]);

  // Default icons available for selection
  const iconOptions = [
    { value: '🔗', label: '🔗 Link' },
    { value: '📊', label: '📊 Chart' },
    { value: '📝', label: '📝 Document' },
    { value: '💻', label: '💻 Computer' },
    { value: '🛠️', label: '🛠️ Tool' },
    { value: '📱', label: '📱 Mobile' },
    { value: '🔒', label: '🔒 Security' },
    { value: '📈', label: '📈 Analytics' },
    { value: '🗂️', label: '🗂️ Database' },
    { value: '⚙️', label: '⚙️ Settings' },
  ];

  // Predefined categories + custom option
  const categoryOptions = [
    { value: '', label: 'Select a category' },
    ...existingCategories.map(cat => ({ value: cat, label: cat })),
    { value: 'custom', label: '+ Add New Category' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      // URL validation
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL (include http:// or https://)';
      }
    }
    
    // If custom category is selected but not provided
    if (formData.category === 'custom' && !formData.customCategory.trim()) {
      newErrors.customCategory = 'Please provide a category name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const togglePreview = () => {
    if (!isPreview && !validateForm()) {
      return; // Don't show preview if form is invalid
    }
    setIsPreview(!isPreview);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Determine final category (custom or selected)
      const finalCategory = formData.category === 'custom' 
        ? formData.customCategory.trim() 
        : formData.category;
      
      const { data, error } = await supabase
        .from('quick_links')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          url: formData.url.trim(),
          icon: formData.icon || null,
          category: finalCategory || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', link.id)
        .select()
        .single();
      
      if (error) throw error;
      
      onSuccess(data);
    } catch (err) {
      console.error('Error updating quick link:', err);
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview component
  const renderPreview = () => {
    const previewIcon = formData.icon || '🔗';
    const previewCategory = formData.category === 'custom' 
      ? formData.customCategory 
      : formData.category || 'Uncategorized';
    
    return (
      <div className="p-6 bg-white rounded-xl border-2 border-indigo-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Link Preview</h2>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                {previewIcon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{formData.name || 'Untitled Link'}</h3>
                <span className="text-xs text-slate-500">{previewCategory}</span>
              </div>
            </div>
          </div>

          {formData.description && (
            <p className="text-sm text-slate-600 mb-4">{formData.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>{link.click_count || 0} views</span>
            </div>
            <button className="flex items-center space-x-1 text-indigo-600 text-sm">
              <span>Open</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              {isPreview ? 'Preview Quick Link' : 'Edit Quick Link'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isPreview ? (
          <div className="p-6 space-y-6">
            {renderPreview()}
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={togglePreview}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Link Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } rounded-lg`}
                  placeholder="e.g., Supabase Dashboard"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-1">
                  URL *
                </label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.url ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } rounded-lg`}
                  placeholder="https://app.supabase.com"
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief description of this resource"
                />
              </div>

              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-slate-700 mb-1">
                  Icon
                </label>
                <select
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select an icon</option>
                  {iconOptions.map(icon => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {categoryOptions.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {formData.category === 'custom' && (
                <div>
                  <label htmlFor="customCategory" className="block text-sm font-medium text-slate-700 mb-1">
                    New Category Name
                  </label>
                  <input
                    type="text"
                    id="customCategory"
                    name="customCategory"
                    value={formData.customCategory}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      errors.customCategory ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                    } rounded-lg`}
                    placeholder="e.g., Development Tools"
                  />
                  {errors.customCategory && (
                    <p className="mt-1 text-sm text-red-600">{errors.customCategory}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-xs text-slate-500">
                Last updated: {new Date(link.updated_at).toLocaleString()}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={togglePreview}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Preview
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}