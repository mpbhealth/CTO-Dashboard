import { useState } from 'react';
import { X, Plus, Globe, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddPropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPropertyForm({ isOpen, onClose, onSuccess }: AddPropertyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    ga_property_id: '',
    ga_measurement_id: '',
    fb_pixel_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('marketing_properties')
        .insert([{
          user_id: user.id,
          name: formData.name,
          website_url: formData.website_url || null,
          ga_property_id: formData.ga_property_id || null,
          ga_measurement_id: formData.ga_measurement_id || null,
          ga_connected: false,
          fb_pixel_id: formData.fb_pixel_id || null,
          fb_connected: false
        }])
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setFormData({
        name: '',
        website_url: '',
        ga_property_id: '',
        ga_measurement_id: '',
        fb_pixel_id: ''
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Add Marketing Property</h2>
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
              Property Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., MPB Health Website"
            />
          </div>

          <div>
            <label htmlFor="website_url" className="block text-sm font-medium text-slate-700 mb-1">
              Website URL
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
                placeholder="https://mpbhealth.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ga_property_id" className="block text-sm font-medium text-slate-700 mb-1">
              Google Analytics Property ID
            </label>
            <input
              type="text"
              id="ga_property_id"
              name="ga_property_id"
              value={formData.ga_property_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="123456789"
            />
          </div>

          <div>
            <label htmlFor="ga_measurement_id" className="block text-sm font-medium text-slate-700 mb-1">
              GA4 Measurement ID
            </label>
            <input
              type="text"
              id="ga_measurement_id"
              name="ga_measurement_id"
              value={formData.ga_measurement_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          <div>
            <label htmlFor="fb_pixel_id" className="block text-sm font-medium text-slate-700 mb-1">
              Facebook Pixel ID
            </label>
            <input
              type="text"
              id="fb_pixel_id"
              name="fb_pixel_id"
              value={formData.fb_pixel_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="123456789012345"
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
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Property</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}