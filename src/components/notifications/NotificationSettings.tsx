// ============================================
// NotificationSettings Component
// User preferences for notifications
// ============================================

import { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Moon,
  Clock,
  Shield,
  AlertTriangle,
  UserPlus,
  FolderKanban,
  Rocket,
  Check,
  Loader2,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationPreferences } from '../../types/notifications';

interface NotificationSettingsProps {
  className?: string;
}

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

function Toggle({ enabled, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}
      `}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full 
          bg-white shadow ring-0 transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const {
    preferences,
    updatePreferences,
    permissionStatus,
    requestPermission,
    sendTestNotification,
  } = useNotifications();

  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize local state from preferences
  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  // Handle preference change
  const handleChange = async (key: keyof NotificationPreferences, value: boolean | string) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
    setIsSaving(true);
    
    try {
      await updatePreferences({ [key]: value });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const notificationTypes = [
    {
      key: 'critical_alerts' as const,
      label: 'Critical Alerts',
      description: 'High-priority incidents and urgent escalations',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
    },
    {
      key: 'system_incidents' as const,
      label: 'System Incidents',
      description: 'API outages and infrastructure issues',
      icon: Shield,
      iconColor: 'text-orange-500',
    },
    {
      key: 'sla_breaches' as const,
      label: 'SLA Breaches',
      description: 'Service level agreement violations',
      icon: Clock,
      iconColor: 'text-yellow-600',
    },
    {
      key: 'deployment_alerts' as const,
      label: 'Deployment Alerts',
      description: 'Failed deployments and release issues',
      icon: Rocket,
      iconColor: 'text-purple-500',
    },
    {
      key: 'assignments' as const,
      label: 'Assignments',
      description: 'New tasks and assignment changes',
      icon: UserPlus,
      iconColor: 'text-blue-500',
    },
    {
      key: 'project_updates' as const,
      label: 'Project Updates',
      description: 'Project status changes and milestones',
      icon: FolderKanban,
      iconColor: 'text-green-500',
    },
    {
      key: 'compliance_alerts' as const,
      label: 'Compliance Alerts',
      description: 'HIPAA and regulatory compliance issues',
      icon: Shield,
      iconColor: 'text-indigo-500',
    },
  ];

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notification Settings</h3>
              <p className="text-sm text-gray-500">Manage how you receive alerts</p>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Browser Permission */}
        <div className="pb-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Browser Notifications</h4>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {permissionStatus === 'granted' ? (
                <Bell className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Desktop Notifications</p>
                <p className="text-xs text-gray-500">
                  {permissionStatus === 'granted'
                    ? 'Notifications are enabled'
                    : permissionStatus === 'denied'
                    ? 'Notifications are blocked in browser settings'
                    : 'Click to enable desktop notifications'}
                </p>
              </div>
            </div>
            
            {permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
              <button
                onClick={requestPermission}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Enable
              </button>
            )}
            
            {permissionStatus === 'granted' && (
              <button
                onClick={sendTestNotification}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Send Test
              </button>
            )}
          </div>
        </div>

        {/* Sound Settings */}
        <div className="pb-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Sound</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {localPrefs.sound_enabled ? (
                <Volume2 className="w-5 h-5 text-indigo-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Notification Sound</p>
                <p className="text-xs text-gray-500">Play a sound when notifications arrive</p>
              </div>
            </div>
            <Toggle
              enabled={localPrefs.sound_enabled ?? true}
              onChange={(v) => handleChange('sound_enabled', v)}
            />
          </div>
        </div>

        {/* Do Not Disturb */}
        <div className="pb-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Do Not Disturb</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Enable DND Mode</p>
                  <p className="text-xs text-gray-500">Silence non-critical notifications</p>
                </div>
              </div>
              <Toggle
                enabled={localPrefs.dnd_enabled ?? false}
                onChange={(v) => handleChange('dnd_enabled', v)}
              />
            </div>

            {localPrefs.dnd_enabled && (
              <div className="ml-8 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-700">Quiet Hours Start</label>
                    <input
                      type="time"
                      value={localPrefs.quiet_hours_start || '22:00'}
                      onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-700">Quiet Hours End</label>
                    <input
                      type="time"
                      value={localPrefs.quiet_hours_end || '08:00'}
                      onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Critical Bypass</p>
                    <p className="text-xs text-gray-500">Allow critical alerts during DND</p>
                  </div>
                  <Toggle
                    enabled={localPrefs.critical_bypass_dnd ?? true}
                    onChange={(v) => handleChange('critical_bypass_dnd', v)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Notification Types</h4>
          
          <div className="space-y-3">
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              const isEnabled = localPrefs[type.key] ?? true;

              return (
                <div
                  key={type.key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${type.iconColor}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{type.label}</p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </div>
                  <Toggle
                    enabled={isEnabled}
                    onChange={(v) => handleChange(type.key, v)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

