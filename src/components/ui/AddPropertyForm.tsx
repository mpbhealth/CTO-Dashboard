import { useState } from 'react';
import { X, Globe, BarChart3, Save, AlertCircle } from 'lucide-react';

interface AddPropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPropertyForm({
  isOpen,
  onClose,
  onSuccess
}: AddPropertyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    description: '',
    property_type: 'website',
    ga_property_id: '',
    ga_measurement_id: '',
    fb_pixel_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Property name is required');
      }

      if (!formData.website_url.trim()) {
        throw new Error('Website URL is required');
      }

      // Validate URL format
      try {
        new URL(formData.website_url);
      } catch {
        throw new Error('Please enter a valid URL');
      }

      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset form
      setFormData({
        name: '',
        website_url: '',
        description: '',
        property_type: 'website',
        ga_property_id: '',
        ga_measurement_id: '',
        fb_pixel_id: ''
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        website_url: '',
        description: '',
        property_type: 'website',
        ga_property_id: '',
        ga_measurement_id: '',
        fb_pixel_id: ''
      });
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add Marketing Property</h2>
              <p className="text-sm text-slate-600">Create a new property to track analytics</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900">Basic Information</h3>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Property Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Company Website, Mobile App"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-slate-700 mb-2">
                Website URL *
              </label>
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label htmlFor="property_type" className="block text-sm font-medium text-slate-700 mb-2">
                Property Type
              </label>
              <select
                id="property_type"
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="website">Website</option>
                <option value="mobile_app">Mobile App</option>
                <option value="landing_page">Landing Page</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional description of this property"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Integration Settings */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-slate-900">Integration Settings (Optional)</h3>
            <p className="text-sm text-slate-600">You can configure these later in the settings</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ga_property_id" className="block text-sm font-medium text-slate-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Google Analytics Property ID</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="ga_property_id"
                  name="ga_property_id"
                  value={formData.ga_property_id}
                  onChange={handleChange}
                  placeholder="GA4-XXXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label htmlFor="ga_measurement_id" className="block text-sm font-medium text-slate-700 mb-2">
                  Google Measurement ID
                </label>
                <input
                  type="text"
                  id="ga_measurement_id"
                  name="ga_measurement_id"
                  value={formData.ga_measurement_id}
                  onChange={handleChange}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fb_pixel_id" className="block text-sm font-medium text-slate-700 mb-2">
                Facebook Pixel ID
              </label>
              <input
                type="text"
                id="fb_pixel_id"
                name="fb_pixel_id"
                value={formData.fb_pixel_id}
                onChange={handleChange}
                placeholder="123456789012345"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Property'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}