'use client';

import { motion } from 'framer-motion';
import { Settings, User, Bell, Palette, Shield, Link2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Settings Page
 * 
 * User preferences and app configuration
 */
export default function SettingsPage() {
  const { profile, signOut } = useAuth();

  const settingsSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        { label: 'Profile', description: 'Update your personal information' },
        { label: 'Password', description: 'Change your password' },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Email Notifications', description: 'Manage email preferences' },
        { label: 'Push Notifications', description: 'Control in-app alerts' },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        { label: 'Theme', description: 'Light, dark, or system' },
        { label: 'Dock', description: 'Customize your dock icons' },
      ],
    },
    {
      title: 'Security',
      icon: Shield,
      items: [
        { label: 'Two-Factor Auth', description: 'Add extra security' },
        { label: 'Sessions', description: 'Manage active sessions' },
      ],
    },
    {
      title: 'Integrations',
      icon: Link2,
      items: [
        { label: 'Connected Apps', description: 'Manage third-party connections' },
        { label: 'API Keys', description: 'Developer access tokens' },
      ],
    },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-space-grotesk)]">
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </motion.div>

      {/* User Info Card */}
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-white">
            {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {profile?.full_name || profile?.display_name || 'User'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">{profile?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {profile?.role?.toUpperCase() || 'STAFF'}
            </span>
          </div>
          <button
            onClick={async () => {
              try {
                sessionStorage.removeItem('mpb_access_verified');
                await signOut();
                // signOut handles redirect internally
              } catch (error) {
                console.error('Error signing out:', error);
                window.location.href = '/login';
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section, sectionIndex) => {
          const SectionIcon = section.icon;
          return (
            <motion.div
              key={section.title}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + sectionIndex * 0.1 }}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <SectionIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {section.title}
                </h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {item.description}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

