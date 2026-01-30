import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

export const SIDEBAR_CONSTANTS = {
  // Dimensions
  EXPANDED_WIDTH: 320,
  COLLAPSED_WIDTH: 80,
  ADMIN_EXPANDED_WIDTH: 288,
  ADMIN_COLLAPSED_WIDTH: 72,
  
  // Breakpoints
  MOBILE_BREAKPOINT: 768,
  
  // Touch/Swipe
  SWIPE_THRESHOLD: 100,
  MAX_DRAG_OFFSET: -320,
  
  // Animation
  TRANSITION_DURATION: 300,
  
  // Accessibility
  MIN_TOUCH_TARGET: 44,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface UseSidebarOptions {
  /** Initial expanded state */
  initialExpanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Custom mobile breakpoint */
  mobileBreakpoint?: number;
  /** Storage key for persisting state */
  storageKey?: string;
}

export interface UseSidebarReturn {
  // State
  isExpanded: boolean;
  isMobile: boolean;
  isDragging: boolean;
  dragOffset: number;
  
  // Refs
  sidebarRef: React.RefObject<HTMLDivElement>;
  
  // Actions
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  
  // Touch handlers
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  
  // Computed
  sidebarTransform: string | undefined;
  sidebarWidth: number;
}

export interface ExpandedMenusState {
  expandedMenus: string[];
  toggleMenu: (menuId: string) => void;
  expandMenu: (menuId: string) => void;
  collapseMenu: (menuId: string) => void;
  isMenuExpanded: (menuId: string) => boolean;
  setExpandedMenus: React.Dispatch<React.SetStateAction<string[]>>;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Custom hook for managing sidebar state and interactions
 * Handles mobile detection, touch gestures, and state persistence
 */
export function useSidebar(options: UseSidebarOptions = {}): UseSidebarReturn {
  const {
    initialExpanded = true,
    onExpandedChange,
    mobileBreakpoint = SIDEBAR_CONSTANTS.MOBILE_BREAKPOINT,
    storageKey,
  } = options;

  // State
  const [isExpanded, setIsExpanded] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return initialExpanded;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);

  // Mobile detection with resize observer for better performance
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < mobileBreakpoint;
      setIsMobile(mobile);
      if (mobile && isExpanded) {
        setIsExpanded(false);
      }
    };

    // Initial check
    checkMobile();

    // Use ResizeObserver for better performance if available
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(checkMobile);
      observer.observe(document.body);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [mobileBreakpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist state to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, String(isExpanded));
    }
  }, [isExpanded, storageKey]);

  // Actions
  const toggle = useCallback(() => {
    setIsExpanded(prev => {
      const newValue = !prev;
      onExpandedChange?.(newValue);
      return newValue;
    });
  }, [onExpandedChange]);

  const expand = useCallback(() => {
    setIsExpanded(true);
    onExpandedChange?.(true);
  }, [onExpandedChange]);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    onExpandedChange?.(false);
  }, [onExpandedChange]);

  // Touch handlers for swipe-to-close on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isExpanded) return;
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, [isMobile, isExpanded]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    // Only allow dragging left (negative values)
    if (diff < 0) {
      setDragOffset(diff);
    }
  }, [isDragging, isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = touchCurrentX.current - touchStartX.current;
    // Close sidebar if dragged past threshold
    if (diff < -SIDEBAR_CONSTANTS.SWIPE_THRESHOLD) {
      collapse();
    }
    setDragOffset(0);
  }, [isDragging, collapse]);

  // Computed values
  const sidebarTransform = useMemo(() => {
    if (isDragging && isMobile) {
      return `translateX(${Math.max(dragOffset, SIDEBAR_CONSTANTS.MAX_DRAG_OFFSET)}px)`;
    }
    return undefined;
  }, [isDragging, isMobile, dragOffset]);

  const sidebarWidth = useMemo(() => {
    return isExpanded ? SIDEBAR_CONSTANTS.EXPANDED_WIDTH : SIDEBAR_CONSTANTS.COLLAPSED_WIDTH;
  }, [isExpanded]);

  return {
    isExpanded,
    isMobile,
    isDragging,
    dragOffset,
    sidebarRef,
    toggle,
    expand,
    collapse,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    sidebarTransform,
    sidebarWidth,
  };
}

/**
 * Hook for managing expanded/collapsed state of navigation menus
 */
export function useExpandedMenus(initialMenus: string[] = []): ExpandedMenusState {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(initialMenus);

  const toggleMenu = useCallback((menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  }, []);

  const expandMenu = useCallback((menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) ? prev : [...prev, menuId]
    );
  }, []);

  const collapseMenu = useCallback((menuId: string) => {
    setExpandedMenus(prev => prev.filter(id => id !== menuId));
  }, []);

  const isMenuExpanded = useCallback((menuId: string) => {
    return expandedMenus.includes(menuId);
  }, [expandedMenus]);

  return {
    expandedMenus,
    toggleMenu,
    expandMenu,
    collapseMenu,
    isMenuExpanded,
    setExpandedMenus,
  };
}

/**
 * Hook for keyboard navigation in sidebar
 */
export function useSidebarKeyboard(
  items: { id: string; hasSubmenu?: boolean }[],
  onNavigate: (itemId: string) => void,
  onToggleSubmenu: (itemId: string) => void
) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'ArrowRight':
        if (focusedIndex >= 0 && items[focusedIndex]?.hasSubmenu) {
          e.preventDefault();
          onToggleSubmenu(items[focusedIndex].id);
        }
        break;
      case 'ArrowLeft':
        if (focusedIndex >= 0 && items[focusedIndex]?.hasSubmenu) {
          e.preventDefault();
          onToggleSubmenu(items[focusedIndex].id);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          onNavigate(items[focusedIndex].id);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
    }
  }, [items, focusedIndex, onNavigate, onToggleSubmenu]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
  };
}

/**
 * Hook for managing focus trap in mobile sidebar
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Dispatch custom event for parent to handle
        container.dispatchEvent(new CustomEvent('sidebar-escape'));
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscape);

    // Focus first element when trap activates
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isActive, containerRef]);
}

/**
 * Hook for body scroll lock when mobile sidebar is open
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
}
