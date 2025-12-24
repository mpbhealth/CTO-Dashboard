'use client';

import React, { useState, useCallback, createContext, useContext } from 'react';
import { GalaxyDock } from './GalaxyDock';
import { CommandPalette } from './CommandPalette';
import { GalaxyMapModal } from './GalaxyMapModal';

/**
 * Shell context for managing global shell state
 */
interface ShellContextType {
  isPaletteOpen: boolean;
  isMapOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  openMap: () => void;
  closeMap: () => void;
  toggleMap: () => void;
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShell must be used within AppShell');
  }
  return context;
}

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell - The persistent wrapper for CommandOS
 * 
 * This component never unmounts during navigation, providing:
 * - GalaxyDock (bottom floating dock)
 * - CommandPalette (Cmd+K quick actions)
 * - GalaxyMapModal (universe map of all apps)
 * 
 * The shell persists across all route transitions within (shell) route group
 */
export function AppShell({ children }: AppShellProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Palette controls
  const openPalette = useCallback(() => setIsPaletteOpen(true), []);
  const closePalette = useCallback(() => setIsPaletteOpen(false), []);
  const togglePalette = useCallback(() => setIsPaletteOpen((prev) => !prev), []);

  // Map controls
  const openMap = useCallback(() => setIsMapOpen(true), []);
  const closeMap = useCallback(() => setIsMapOpen(false), []);
  const toggleMap = useCallback(() => setIsMapOpen((prev) => !prev), []);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        togglePalette();
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        if (isPaletteOpen) {
          closePalette();
        } else if (isMapOpen) {
          closeMap();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen, isMapOpen, togglePalette, closePalette, closeMap]);

  const contextValue: ShellContextType = {
    isPaletteOpen,
    isMapOpen,
    openPalette,
    closePalette,
    togglePalette,
    openMap,
    closeMap,
    toggleMap,
  };

  return (
    <ShellContext.Provider value={contextValue}>
      <div className="relative min-h-screen">
        {/* Main content area */}
        <main className="pb-24">
          {children}
        </main>

        {/* Persistent shell components */}
        <GalaxyDock onOpenMap={openMap} />

        {/* Command Palette Modal */}
        {isPaletteOpen && (
          <CommandPalette onClose={closePalette} />
        )}

        {/* Galaxy Map Modal */}
        {isMapOpen && (
          <GalaxyMapModal onClose={closeMap} />
        )}
      </div>
    </ShellContext.Provider>
  );
}

