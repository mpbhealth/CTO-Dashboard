'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Galaxy Home - Landing page within the shell
 * Redirects to role-appropriate dashboard or shows welcome screen
 */
export default function GalaxyHome() {
  const router = useRouter();
  const { profile, profileReady } = useAuth();

  useEffect(() => {
    if (profileReady && profile?.role) {
      const isCEORole = ['ceo', 'cfo', 'cmo', 'admin'].includes(profile.role.toLowerCase());
      router.replace(isCEORole ? '/ceo' : '/cto');
    }
  }, [profileReady, profile?.role, router]);

  // Show loading while determining role
  if (!profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Welcome screen while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center max-w-lg px-6">
        {/* Animated Logo */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 animate-pulse-glow" />
          <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-primary-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4 font-[family-name:var(--font-space-grotesk)]">
          Welcome to CommandOS
        </h1>
        <p className="text-lg text-slate-400 mb-8">
          Your unified enterprise command center
        </p>

        {/* Quick stats preview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Apps', value: '7+' },
            { label: 'Modules', value: '12+' },
            { label: 'Integrations', value: '20+' },
          ].map((stat) => (
            <div key={stat.label} className="glass-dark rounded-xl p-4">
              <div className="text-2xl font-bold text-primary-400">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

