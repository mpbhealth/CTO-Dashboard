'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GalaxyDock } from './GalaxyDock';
import { GalaxyMapModal } from './GalaxyMapModal';
import { CommandPalette } from './CommandPalette';

interface ShellContextType {
  isPaletteOpen: boolean;
  isMapOpen: boolean;
  isDockVisible: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  openMap: () => void;
  closeMap: () => void;
  toggleMap: () => void;
  showDock: () => void;
  hideDock: () => void;
  toggleDock: () => void;
}

const ShellContext = createContext<ShellContextType | null>(null);

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell - Main application shell with floating command center
 * 
 * Features:
 * - GalaxyDock: Premium floating dock with app shortcuts, search, and quick actions
 * - CommandPalette: Spotlight-style command palette (⌘K)
 * - GalaxyMapModal: Full-screen navigation map
 * - Centralized state management for shell components
 */
export function AppShell({ children }: AppShellProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isDockVisible, setIsDockVisible] = useState(true);

  // Command Palette controls
  const openPalette = useCallback(() => setIsPaletteOpen(true), []);
  const closePalette = useCallback(() => setIsPaletteOpen(false), []);
  const togglePalette = useCallback(() => setIsPaletteOpen((prev) => !prev), []);

  // Galaxy Map controls
  const openMap = useCallback(() => setIsMapOpen(true), []);
  const closeMap = useCallback(() => setIsMapOpen(false), []);
  const toggleMap = useCallback(() => setIsMapOpen((prev) => !prev), []);

  // Dock visibility controls
  const showDock = useCallback(() => setIsDockVisible(true), []);
  const hideDock = useCallback(() => setIsDockVisible(false), []);
  const toggleDock = useCallback(() => setIsDockVisible((prev) => !prev), []);

  const contextValue: ShellContextType = {
    isPaletteOpen,
    isMapOpen,
    isDockVisible,
    openPalette,
    closePalette,
    togglePalette,
    openMap,
    closeMap,
    toggleMap,
    showDock,
    hideDock,
    toggleDock,
  };

  return (
    <ShellContext.Provider value={contextValue}>
      <div className="relative min-h-screen">
        <main className="pb-24">
          {children}
        </main>

        {/* Floating Dock - Always visible at bottom center */}
        {isDockVisible && (
          <GalaxyDock onOpenMap={openMap} />
        )}

        {/* Galaxy Map Modal */}
        <GalaxyMapModal isOpen={isMapOpen} onClose={closeMap} />

        {/* Command Palette */}
        <CommandPalette isOpen={isPaletteOpen} onClose={closePalette} />
      </div>
    </ShellContext.Provider>
  );
}

/**
 * Hook to access shell context from any component
 */
export function useShell(): ShellContextType {
  const context = useContext(ShellContext);
  
  // Return fallback for components outside ShellContext
  if (!context) {
    return {
      isPaletteOpen: false,
      isMapOpen: false,
      isDockVisible: true,
      openPalette: () => {},
      closePalette: () => {},
      togglePalette: () => {},
      openMap: () => {},
      closeMap: () => {},
      toggleMap: () => {},
      showDock: () => {},
      hideDock: () => {},
      toggleDock: () => {},
    };
  }
  
  return context;
}

