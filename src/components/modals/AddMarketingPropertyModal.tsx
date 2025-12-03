import { useState, useEffect } from 'react';
import { X, Globe, BarChart3, Facebook, Instagram, Linkedin, TrendingUp } from 'lucide-react';
import { useMarketingProperties } from '../../hooks/useMarketingData';
import { handleError } from '../../lib/errorHandler';

interface AddMarketingPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PropertyFormData {
  name: string;
  website_url: string;
  ga_measurement_id: string;
  ga_property_id: string;
  fb_pixel_id: string;
  instagram_business_id: string;
  tiktok_pixel_id: string;
  linkedin_partner_id: string;
  gtm_container_id: string;
  google_ads_conversion_id: string;
  bing_uet_tag_id: string;
  hotjar_site_id: string;
  timezone: string;
  notes: string;
}

export default function AddMarketingPropertyModal({
  isOpen,
  onClose,
  onSuccess,
}: AddMarketingPropertyModalProps) {
  const { addProperty } = useMarketingProperties();
  const [activeTab, setActiveTab] = useState<'basic' | 'tracking' | 'advanced'>('basic');
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    website_url: '',
    ga_measurement_id: '',
    ga_property_id: '',
    fb_pixel_id: '',
    instagram_business_id: '',
    tiktok_pixel_id: '',
    linkedin_partner_id: '',
    gtm_container_id: '',
    google_ads_conversion_id: '',
    bing_uet_tag_id: '',
    hotjar_site_id: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        website_url: '',
        ga_measurement_id: '',
        ga_property_id: '',
        fb_pixel_id: '',
        instagram_business_id: '',
        tiktok_pixel_id: '',
        linkedin_partner_id: '',
        gtm_container_id: '',
        google_ads_conversion_id: '',
        bing_uet_tag_id: '',
        hotjar_site_id: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: '',
      });
      setError(null);
      setActiveTab('basic');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await addProperty({
        name: formData.name,
        website_url: formData.website_url || null,
        ga_property_id: formData.ga_property_id || null,
        ga_measurement_id: formData.ga_measurement_id || null,
        ga_connected: !!formData.ga_measurement_id,
        fb_pixel_id: formData.fb_pixel_id || null,
        fb_connected: !!formData.fb_pixel_id,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(handleError('AddMarketingPropertyModal', err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add Marketing Property</h2>
            <p className="text-sm text-slate-600 mt-1">Configure tracking for your website or application</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'basic'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tracking'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Tracking Platforms
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'advanced'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Advanced
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="MPB Health - Main Website"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">A descriptive name for this property</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Website URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <input
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="https://mpbhealth.com"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">The primary domain you want to track</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="America/Anchorage">Alaska</option>
                    <option value="Pacific/Honolulu">Hawaii</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Used for accurate reporting and data aggregation</p>
                </div>
              </div>
            )}

            {activeTab === 'tracking' && (
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Google Analytics 4</h3>
                      <p className="text-xs text-slate-600">Track website traffic and user behavior</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Measurement ID
                      </label>
                      <input
                        type="text"
                        value={formData.ga_measurement_id}
                        onChange={(e) => setFormData({ ...formData, ga_measurement_id: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Property ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.ga_property_id}
                        onChange={(e) => setFormData({ ...formData, ga_property_id: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Facebook Pixel</h3>
                      <p className="text-xs text-slate-600">Track conversions and build audiences</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Pixel ID
                    </label>
                    <input
                      type="text"
                      value={formData.fb_pixel_id}
                      onChange={(e) => setFormData({ ...formData, fb_pixel_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123456789012345"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Instagram Shopping</h3>
                      <p className="text-xs text-slate-600">Track product views and purchases</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Business Account ID
                    </label>
                    <input
                      type="text"
                      value={formData.instagram_business_id}
                      onChange={(e) => setFormData({ ...formData, instagram_business_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="1234567890"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                      <Linkedin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">LinkedIn Insight Tag</h3>
                      <p className="text-xs text-slate-600">Track B2B conversions and visitors</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Partner ID
                    </label>
                    <input
                      type="text"
                      value={formData.linkedin_partner_id}
                      onChange={(e) => setFormData({ ...formData, linkedin_partner_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234567"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">TikTok Pixel</h3>
                      <p className="text-xs text-slate-600">Measure TikTok ad performance</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Pixel ID
                    </label>
                    <input
                      type="text"
                      value={formData.tiktok_pixel_id}
                      onChange={(e) => setFormData({ ...formData, tiktok_pixel_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="ABCDEFGHIJKLMNOP"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Tag Management</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Google Tag Manager Container ID
                    </label>
                    <input
                      type="text"
                      value={formData.gtm_container_id}
                      onChange={(e) => setFormData({ ...formData, gtm_container_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="GTM-XXXXXXX"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Advertising Platforms</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Google Ads Conversion ID
                      </label>
                      <input
                        type="text"
                        value={formData.google_ads_conversion_id}
                        onChange={(e) => setFormData({ ...formData, google_ads_conversion_id: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="AW-123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Bing UET Tag ID
                      </label>
                      <input
                        type="text"
                        value={formData.bing_uet_tag_id}
                        onChange={(e) => setFormData({ ...formData, bing_uet_tag_id: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="12345678"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Analytics Tools</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Hotjar Site ID
                    </label>
                    <input
                      type="text"
                      value={formData.hotjar_site_id}
                      onChange={(e) => setFormData({ ...formData, hotjar_site_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add any additional notes or configuration details..."
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Property...' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
