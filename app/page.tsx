'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root page - redirects to appropriate dashboard based on user role
 * This is a client-side redirect; auth middleware handles protected routes
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Default redirect to CTO dashboard
    // Auth middleware will handle role-based routing
    router.replace('/cto');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <div className="relative">
          {/* Animated loading ring */}
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-primary-500/30" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
          </div>
          
          {/* Logo/Title */}
          <h1 className="text-2xl font-bold text-white mb-2 font-[family-name:var(--font-space-grotesk)]">
            CommandOS
          </h1>
          <p className="text-slate-400 text-sm">
            Initializing your command center...
          </p>
        </div>
      </div>
    </div>
  );
}

