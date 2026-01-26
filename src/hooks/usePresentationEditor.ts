import { useState, useCallback, useEffect } from 'react';
import {
  PresentationConfig,
  defaultPresentationConfig,
  PRESENTATION_CONFIG_KEY,
  generateId,
  UserItem,
  AppItem,
  ServiceItem,
  TakeawayItem,
  PlatformNode,
  VendorItem,
  DataFlowItem,
  DataHubCallout,
  EvolutionItem,
  TransitionSection,
  TimelineStep,
} from '@/config/presentationData';

// Slide section types for type-safe updates
export type ArchitectureSection = 'users' | 'memberApps' | 'internalApps' | 'services' | 'partners' | 'takeaways';
export type DataHubSection = 'platforms' | 'dataFlows' | 'vendors' | 'callouts';
export type EvolutionSection = 'columns' | 'timeline';
export type SlideType = 'architecture' | 'dataHub' | 'evolution';

// Item types union
export type EditableItem =
  | UserItem
  | AppItem
  | ServiceItem
  | TakeawayItem
  | PlatformNode
  | VendorItem
  | DataFlowItem
  | DataHubCallout
  | EvolutionItem
  | TransitionSection
  | TimelineStep;

interface UsePresentationEditorReturn {
  // State
  config: PresentationConfig;
  isEditMode: boolean;
  hasChanges: boolean;

  // Mode controls
  setEditMode: (mode: boolean) => void;
  toggleEditMode: () => void;

  // Update functions
  updateArchitectureSection: <K extends keyof PresentationConfig['architecture']>(
    section: K,
    items: PresentationConfig['architecture'][K]
  ) => void;
  updateDataHubSection: <K extends keyof PresentationConfig['dataHub']>(
    section: K,
    items: PresentationConfig['dataHub'][K]
  ) => void;
  updateEvolutionSection: <K extends keyof PresentationConfig['evolution']>(
    section: K,
    items: PresentationConfig['evolution'][K]
  ) => void;

  // Item operations
  updateItem: (
    slide: SlideType,
    section: string,
    itemId: string,
    updates: Partial<EditableItem>
  ) => void;
  reorderItems: (
    slide: SlideType,
    section: string,
    oldIndex: number,
    newIndex: number
  ) => void;
  addItem: (slide: SlideType, section: string, item: EditableItem) => void;
  removeItem: (slide: SlideType, section: string, itemId: string) => void;

  // Partner-specific (string array)
  updatePartners: (partners: string[]) => void;
  addPartner: (partner: string) => void;
  removePartner: (index: number) => void;

  // Stats update
  updateDataHubStats: (stats: Partial<PresentationConfig['dataHub']['stats']>) => void;

  // Persistence
  saveConfig: () => void;
  resetToDefault: () => void;
  loadConfig: () => void;
}

/**
 * Hook for managing presentation editor state and persistence
 */
export function usePresentationEditor(): UsePresentationEditorReturn {
  const [config, setConfig] = useState<PresentationConfig>(defaultPresentationConfig);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = useCallback(() => {
    try {
      const saved = localStorage.getItem(PRESENTATION_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PresentationConfig;
        setConfig(parsed);
      }
    } catch (error) {
      console.warn('Failed to load presentation config:', error);
    }
  }, []);

  const saveConfig = useCallback(() => {
    try {
      localStorage.setItem(PRESENTATION_CONFIG_KEY, JSON.stringify(config));
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save presentation config:', error);
    }
  }, [config]);

  const resetToDefault = useCallback(() => {
    setConfig(defaultPresentationConfig);
    localStorage.removeItem(PRESENTATION_CONFIG_KEY);
    setHasChanges(false);
  }, []);

  const setEditMode = useCallback((mode: boolean) => {
    setIsEditMode(mode);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  // Generic section update for architecture
  const updateArchitectureSection = useCallback(<K extends keyof PresentationConfig['architecture']>(
    section: K,
    items: PresentationConfig['architecture'][K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      architecture: {
        ...prev.architecture,
        [section]: items,
      },
    }));
    setHasChanges(true);
  }, []);

  // Generic section update for dataHub
  const updateDataHubSection = useCallback(<K extends keyof PresentationConfig['dataHub']>(
    section: K,
    items: PresentationConfig['dataHub'][K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      dataHub: {
        ...prev.dataHub,
        [section]: items,
      },
    }));
    setHasChanges(true);
  }, []);

  // Generic section update for evolution
  const updateEvolutionSection = useCallback(<K extends keyof PresentationConfig['evolution']>(
    section: K,
    items: PresentationConfig['evolution'][K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      evolution: {
        ...prev.evolution,
        [section]: items,
      },
    }));
    setHasChanges(true);
  }, []);

  // Update single item within a section
  const updateItem = useCallback((
    slide: SlideType,
    section: string,
    itemId: string,
    updates: Partial<EditableItem>
  ) => {
    setConfig((prev) => {
      const newConfig = { ...prev };

      if (slide === 'architecture') {
        const archSection = section as keyof PresentationConfig['architecture'];
        const items = prev.architecture[archSection];
        if (Array.isArray(items) && typeof items[0] === 'object') {
          (newConfig.architecture[archSection] as EditableItem[]) = (items as EditableItem[]).map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          );
        }
      } else if (slide === 'dataHub') {
        const hubSection = section as keyof PresentationConfig['dataHub'];
        const items = prev.dataHub[hubSection];
        if (Array.isArray(items)) {
          (newConfig.dataHub[hubSection] as EditableItem[]) = (items as EditableItem[]).map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          );
        }
      } else if (slide === 'evolution') {
        const evoSection = section as keyof PresentationConfig['evolution'];
        const items = prev.evolution[evoSection];
        if (Array.isArray(items)) {
          (newConfig.evolution[evoSection] as EditableItem[]) = (items as EditableItem[]).map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          );
        }
      }

      return newConfig;
    });
    setHasChanges(true);
  }, []);

  // Reorder items within a section
  const reorderItems = useCallback((
    slide: SlideType,
    section: string,
    oldIndex: number,
    newIndex: number
  ) => {
    setConfig((prev) => {
      const newConfig = { ...prev };

      const arrayMove = <T,>(arr: T[], from: number, to: number): T[] => {
        const newArr = [...arr];
        const [item] = newArr.splice(from, 1);
        newArr.splice(to, 0, item);
        return newArr;
      };

      if (slide === 'architecture') {
        const archSection = section as keyof PresentationConfig['architecture'];
        const items = prev.architecture[archSection];
        if (Array.isArray(items)) {
          (newConfig.architecture as Record<string, unknown>)[archSection] = arrayMove(items, oldIndex, newIndex);
        }
      } else if (slide === 'dataHub') {
        const hubSection = section as keyof PresentationConfig['dataHub'];
        const items = prev.dataHub[hubSection];
        if (Array.isArray(items)) {
          (newConfig.dataHub as Record<string, unknown>)[hubSection] = arrayMove(items, oldIndex, newIndex);
        }
      } else if (slide === 'evolution') {
        const evoSection = section as keyof PresentationConfig['evolution'];
        const items = prev.evolution[evoSection];
        if (Array.isArray(items)) {
          (newConfig.evolution as Record<string, unknown>)[evoSection] = arrayMove(items, oldIndex, newIndex);
        }
      }

      return newConfig;
    });
    setHasChanges(true);
  }, []);

  // Add new item to section
  const addItem = useCallback((slide: SlideType, section: string, item: EditableItem) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      const itemWithId = { ...item, id: item.id || generateId(section) };

      if (slide === 'architecture') {
        const archSection = section as keyof PresentationConfig['architecture'];
        const items = prev.architecture[archSection];
        if (Array.isArray(items)) {
          (newConfig.architecture as Record<string, unknown>)[archSection] = [...items, itemWithId];
        }
      } else if (slide === 'dataHub') {
        const hubSection = section as keyof PresentationConfig['dataHub'];
        const items = prev.dataHub[hubSection];
        if (Array.isArray(items)) {
          (newConfig.dataHub as Record<string, unknown>)[hubSection] = [...items, itemWithId];
        }
      } else if (slide === 'evolution') {
        const evoSection = section as keyof PresentationConfig['evolution'];
        const items = prev.evolution[evoSection];
        if (Array.isArray(items)) {
          (newConfig.evolution as Record<string, unknown>)[evoSection] = [...items, itemWithId];
        }
      }

      return newConfig;
    });
    setHasChanges(true);
  }, []);

  // Remove item from section
  const removeItem = useCallback((slide: SlideType, section: string, itemId: string) => {
    setConfig((prev) => {
      const newConfig = { ...prev };

      if (slide === 'architecture') {
        const archSection = section as keyof PresentationConfig['architecture'];
        const items = prev.architecture[archSection];
        if (Array.isArray(items) && typeof items[0] === 'object') {
          (newConfig.architecture as Record<string, unknown>)[archSection] = (items as EditableItem[]).filter(
            (item) => item.id !== itemId
          );
        }
      } else if (slide === 'dataHub') {
        const hubSection = section as keyof PresentationConfig['dataHub'];
        const items = prev.dataHub[hubSection];
        if (Array.isArray(items)) {
          (newConfig.dataHub as Record<string, unknown>)[hubSection] = (items as EditableItem[]).filter(
            (item) => item.id !== itemId
          );
        }
      } else if (slide === 'evolution') {
        const evoSection = section as keyof PresentationConfig['evolution'];
        const items = prev.evolution[evoSection];
        if (Array.isArray(items)) {
          (newConfig.evolution as Record<string, unknown>)[evoSection] = (items as EditableItem[]).filter(
            (item) => item.id !== itemId
          );
        }
      }

      return newConfig;
    });
    setHasChanges(true);
  }, []);

  // Partner-specific operations (string array)
  const updatePartners = useCallback((partners: string[]) => {
    setConfig((prev) => ({
      ...prev,
      architecture: {
        ...prev.architecture,
        partners,
      },
    }));
    setHasChanges(true);
  }, []);

  const addPartner = useCallback((partner: string) => {
    setConfig((prev) => ({
      ...prev,
      architecture: {
        ...prev.architecture,
        partners: [...prev.architecture.partners, partner],
      },
    }));
    setHasChanges(true);
  }, []);

  const removePartner = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      architecture: {
        ...prev.architecture,
        partners: prev.architecture.partners.filter((_, i) => i !== index),
      },
    }));
    setHasChanges(true);
  }, []);

  // Data hub stats update
  const updateDataHubStats = useCallback((stats: Partial<PresentationConfig['dataHub']['stats']>) => {
    setConfig((prev) => ({
      ...prev,
      dataHub: {
        ...prev.dataHub,
        stats: {
          ...prev.dataHub.stats,
          ...stats,
        },
      },
    }));
    setHasChanges(true);
  }, []);

  return {
    config,
    isEditMode,
    hasChanges,
    setEditMode,
    toggleEditMode,
    updateArchitectureSection,
    updateDataHubSection,
    updateEvolutionSection,
    updateItem,
    reorderItems,
    addItem,
    removeItem,
    updatePartners,
    addPartner,
    removePartner,
    updateDataHubStats,
    saveConfig,
    resetToDefault,
    loadConfig,
  };
}
