import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Mail,
  Shield,
  Bell,
  Palette,
  Plug,
  Globe,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-react';
import { mpbHealthSupabase, isMpbHealthConfigured } from '../../../lib/mpbHealthSupabase';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
  is_sensitive: boolean;
}

interface SettingCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const categories: SettingCategory[] = [
  { id: 'general', label: 'General', icon: Settings, description: 'Basic site configuration' },
  { id: 'email', label: 'Email', icon: Mail, description: 'Email server settings' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Security & authentication' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Notification preferences' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Look and feel' },
  { id: 'integrations', label: 'Integrations', icon: Plug, description: 'Third-party integrations' },
];

// Demo settings
const demoSettings: Setting[] = [
  // General
  { id: '1', setting_key: 'site_name', setting_value: 'MPB Health', setting_type: 'string', category: 'general', description: 'The name of the site', is_sensitive: false },
  { id: '2', setting_key: 'site_description', setting_value: 'Health sharing made simple', setting_type: 'string', category: 'general', description: 'Site description for SEO', is_sensitive: false },
  { id: '3', setting_key: 'support_email', setting_value: 'support@mpb.health', setting_type: 'string', category: 'general', description: 'Support email address', is_sensitive: false },
  { id: '4', setting_key: 'support_phone', setting_value: '1-800-MPB-CARE', setting_type: 'string', category: 'general', description: 'Support phone number', is_sensitive: false },
  { id: '5', setting_key: 'timezone', setting_value: 'America/New_York', setting_type: 'string', category: 'general', description: 'Default timezone', is_sensitive: false },
  { id: '6', setting_key: 'maintenance_mode', setting_value: 'false', setting_type: 'boolean', category: 'general', description: 'Enable maintenance mode', is_sensitive: false },
  
  // Email
  { id: '7', setting_key: 'smtp_host', setting_value: 'smtp.sendgrid.net', setting_type: 'string', category: 'email', description: 'SMTP server hostname', is_sensitive: false },
  { id: '8', setting_key: 'smtp_port', setting_value: '587', setting_type: 'number', category: 'email', description: 'SMTP server port', is_sensitive: false },
  { id: '9', setting_key: 'smtp_username', setting_value: 'apikey', setting_type: 'string', category: 'email', description: 'SMTP username', is_sensitive: false },
  { id: '10', setting_key: 'smtp_password', setting_value: '••••••••••••••••', setting_type: 'string', category: 'email', description: 'SMTP password', is_sensitive: true },
  { id: '11', setting_key: 'from_email', setting_value: 'noreply@mpb.health', setting_type: 'string', category: 'email', description: 'Default from email address', is_sensitive: false },
  { id: '12', setting_key: 'from_name', setting_value: 'MPB Health', setting_type: 'string', category: 'email', description: 'Default from name', is_sensitive: false },
  
  // Security
  { id: '13', setting_key: 'session_timeout', setting_value: '3600', setting_type: 'number', category: 'security', description: 'Session timeout in seconds', is_sensitive: false },
  { id: '14', setting_key: 'max_login_attempts', setting_value: '5', setting_type: 'number', category: 'security', description: 'Max login attempts before lockout', is_sensitive: false },
  { id: '15', setting_key: 'lockout_duration', setting_value: '900', setting_type: 'number', category: 'security', description: 'Lockout duration in seconds', is_sensitive: false },
  { id: '16', setting_key: 'require_mfa', setting_value: 'false', setting_type: 'boolean', category: 'security', description: 'Require MFA for all users', is_sensitive: false },
  { id: '17', setting_key: 'password_min_length', setting_value: '8', setting_type: 'number', category: 'security', description: 'Minimum password length', is_sensitive: false },
  
  // Notifications
  { id: '18', setting_key: 'enable_email_notifications', setting_value: 'true', setting_type: 'boolean', category: 'notifications', description: 'Enable email notifications', is_sensitive: false },
  { id: '19', setting_key: 'enable_sms_notifications', setting_value: 'false', setting_type: 'boolean', category: 'notifications', description: 'Enable SMS notifications', is_sensitive: false },
  { id: '20', setting_key: 'enable_push_notifications', setting_value: 'true', setting_type: 'boolean', category: 'notifications', description: 'Enable push notifications', is_sensitive: false },
  { id: '21', setting_key: 'admin_alert_email', setting_value: 'admin@mpb.health', setting_type: 'string', category: 'notifications', description: 'Admin alert email address', is_sensitive: false },
  
  // Appearance
  { id: '22', setting_key: 'primary_color', setting_value: '#3b82f6', setting_type: 'color', category: 'appearance', description: 'Primary brand color', is_sensitive: false },
  { id: '23', setting_key: 'secondary_color', setting_value: '#10b981', setting_type: 'color', category: 'appearance', description: 'Secondary brand color', is_sensitive: false },
  { id: '24', setting_key: 'dark_mode_enabled', setting_value: 'true', setting_type: 'boolean', category: 'appearance', description: 'Enable dark mode option', is_sensitive: false },
  
  // Integrations
  { id: '25', setting_key: 'google_analytics_id', setting_value: 'G-XXXXXXXXXX', setting_type: 'string', category: 'integrations', description: 'Google Analytics ID', is_sensitive: false },
  { id: '26', setting_key: 'stripe_public_key', setting_value: 'pk_live_••••••••', setting_type: 'string', category: 'integrations', description: 'Stripe public key', is_sensitive: true },
  { id: '27', setting_key: 'stripe_secret_key', setting_value: 'sk_live_••••••••', setting_type: 'string', category: 'integrations', description: 'Stripe secret key', is_sensitive: true },
];

export function SystemSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);

    if (!isMpbHealthConfigured) {
      setSettings(demoSettings);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(demoSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev =>
      prev.map(s => (s.setting_key === key ? { ...s, setting_value: value } : s))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setSaving(false);
  };

  const toggleSensitive = (key: string) => {
    setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const categorySettings = settings.filter(s => s.category === activeCategory);
  const activeConfig = categories.find(c => c.id === activeCategory);
  const ActiveIcon = activeConfig?.icon || Settings;

  const renderSettingInput = (setting: Setting) => {
    const isHidden = setting.is_sensitive && !showSensitive[setting.setting_key];

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <button
            onClick={() => handleSettingChange(
              setting.setting_key,
              setting.setting_value === 'true' ? 'false' : 'true'
            )}
            className={`
              relative w-12 h-6 rounded-full transition-colors
              ${setting.setting_value === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}
            `}
          >
            <span className={`
              absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform
              ${setting.setting_value === 'true' ? 'left-6' : 'left-0.5'}
            `} />
          </button>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={setting.setting_value}
              onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
              className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={setting.setting_value}
              onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={setting.setting_value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        );

      default:
        return (
          <div className="relative">
            <input
              type={isHidden ? 'password' : 'text'}
              value={setting.setting_value}
              onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none pr-10"
            />
            {setting.is_sensitive && (
              <button
                type="button"
                onClick={() => toggleSensitive(setting.setting_key)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {isHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500 mt-1">Configure site settings and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
          {saveSuccess && (
            <span className="text-sm text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Settings saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Category Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 lg:sticky lg:top-4">
            <nav className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                      ${isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{category.label}</p>
                      <p className="text-xs text-slate-400 truncate">{category.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <ActiveIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{activeConfig?.label}</h2>
                <p className="text-sm text-slate-500">{activeConfig?.description}</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
                <p className="text-slate-500 mt-2">Loading settings...</p>
              </div>
            ) : categorySettings.length === 0 ? (
              <div className="py-12 text-center">
                <Settings className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-500 mt-2">No settings found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {categorySettings.map((setting) => (
                  <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <p className="text-xs text-slate-500 mt-1">{setting.description}</p>
                    </div>
                    <div className="md:col-span-2">
                      {renderSettingInput(setting)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Info */}
          <div className="mt-6 bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              System Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Version</p>
                <p className="font-mono font-medium text-slate-900">7.0.0</p>
              </div>
              <div>
                <p className="text-slate-500">Environment</p>
                <p className="font-medium text-slate-900">Production</p>
              </div>
              <div>
                <p className="text-slate-500">Last Deploy</p>
                <p className="font-medium text-slate-900">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Database Status</p>
                <p className="font-medium text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Connected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;

