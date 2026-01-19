'use client';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell - Simple wrapper for the application
 * 
 * Previously contained GalaxyDock, CommandPalette, and GalaxyMapModal.
 * Simplified to just pass through children for cleaner navigation.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen">
      <main>
        {children}
      </main>
    </div>
  );
}

// Provide a no-op useShell hook for backward compatibility
export function useShell() {
  return {
    isPaletteOpen: false,
    isMapOpen: false,
    openPalette: () => {},
    closePalette: () => {},
    togglePalette: () => {},
    openMap: () => {},
    closeMap: () => {},
    toggleMap: () => {},
  };
}

