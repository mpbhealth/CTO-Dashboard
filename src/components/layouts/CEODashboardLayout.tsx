import { ReactNode } from 'react';
import CEOSidebar from '../CEOSidebar';

interface CEODashboardLayoutProps {
  children: ReactNode;
}

export function CEODashboardLayout({ children }: CEODashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <CEOSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
