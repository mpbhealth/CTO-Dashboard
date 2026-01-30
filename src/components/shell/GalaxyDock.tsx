import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  LayoutDashboard, 
  Terminal, 
  Orbit, 
  Ticket, 
  BarChart3, 
  ShieldCheck, 
  Settings,
  Map,
  Command,
  Cog,
  Sparkles,
  Clock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useShell } from './AppShell';
import { usePinnedApps } from '@/hooks/usePinnedApps';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { useQuickActions } from '@/hooks/useQuickActions';
import { DockSearchBar } from './DockSearchBar';
import { ExternalLinkGroup } from './ExternalLinkItem';
import { QuickActionGroup } from './QuickActionItem';
import { DockConfigModal } from './DockConfigModal';
import { DockDashboardSwitcher } from './DockDashboardSwitcher';

/**
 * Icon mapping for dock items
 */
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Terminal,
  Orbit,
  Ticket,
  BarChart3,
  ShieldCheck,
  Settings,
  Map,
  Command,
  Sparkles,
};

/**
 * Custom hook for real-time clock display
 */
function useClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

/**
 * Custom hook to detect mobile screen size
 */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);

    window.addEventListener('resize', checkMobile);
    checkMobile(); // Check on mount

    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

interface DockItem {
  key: string;
  name: string;
  icon: string;
  href: string;
  badge?: number;
}

interface GalaxyDockProps {
  onOpenMap: () => void;
}

/**
 * Sortable Dock Item Component with Magnification Effect
 */
function SortableDockItem({
  item,
  mouseX,
  isActive,
}: {
  item: DockItem;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  isActive: boolean;
}) {
  const navigate = useNavigate();
  const ref = useRef<HTMLButtonElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  // Calculate distance from mouse for magnification
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Scale based on distance (closer = larger)
  const baseSize = 48;
  const maxScale = 1.5;
  const magnifyRange = 150;

  const scale = useTransform(distance, [-magnifyRange, 0, magnifyRange], [1, maxScale, 1]);
  const springScale = useSpring(scale, { mass: 0.1, stiffness: 150, damping: 12 });
  const size = useTransform(springScale, (s) => s * baseSize);

  const Icon = iconMap[item.icon] || LayoutDashboard;

  const handleClick = useCallback(() => {
    if (!isDragging) {
      navigate(item.href);
    }
  }, [navigate, item.href, isDragging]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.button
      ref={(node) => {
        setNodeRef(node);
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }}
      onClick={handleClick}
      className={`
        galaxy-dock-item dock-magnify relative
        ${isActive ? 'active' : ''}
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
      `}
      style={{
        ...style,
        width: size,
        height: size,
      }}
      whileTap={{ scale: 0.95 }}
      title={item.name}
      {...attributes}
      {...listeners}
    >
      <Icon className="w-6 h-6 text-slate-700 dark:text-slate-200" />
      
      {/* Badge */}
      {item.badge && item.badge > 0 && (
        <span className="dock-badge">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}

      {/* Active indicator */}
      {isActive && (
        <motion.span
          className="absolute -bottom-1.5 left-1/2 w-1 h-1 rounded-full bg-primary"
          layoutId="dock-active-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ x: '-50%' }}
        />
      )}
    </motion.button>
  );
}

/**
 * GalaxyDock - Premium Mac-style floating command center
 * 
 * Features:
 * - Bottom-center positioning with premium glassmorphism
 * - Hover magnification effect with smooth physics
 * - Active route indicator with glow effect
 * - Badge counts for notifications
 * - Drag-and-drop reordering
 * - Inline spotlight search
 * - External project links
 * - Quick action buttons
 * - Real-time clock display
 * - Auto-hide functionality
 * - Keyboard shortcuts (⌘K for command palette)
 * - Configuration modal
 * - Accessibility support
 */
export function GalaxyDock({ onOpenMap }: GalaxyDockProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { openPalette } = useShell();
  const { pinnedApps, isLoading, reorderPins } = usePinnedApps();
  const { externalLinks } = useExternalLinks();
  const { quickActions } = useQuickActions();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isMinimized, setIsMinimized] = useState(isMobile); // Start minimized on mobile
  const [showClock, setShowClock] = useState(true);
  const clock = useClock();
  const dockRef = useRef<HTMLDivElement>(null);

  // Auto-minimize on mobile when screen size changes
  useEffect(() => {
    if (isMobile && !isMinimized) {
      setIsMinimized(true);
    }
  }, [isMobile]);
  
  // Mouse position for magnification effect
  const mouseX = useMotionValue(Infinity);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
      // Cmd/Ctrl + / for search
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        // Focus search - handled by DockSearchBar
      }
      // Escape to minimize dock
      if (e.key === 'Escape' && !isConfigOpen) {
        setIsMinimized(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openPalette, isConfigOpen]);

  // Default apps if no pinned apps loaded yet
  const defaultApps: DockItem[] = [
    { key: 'ceo-home', name: 'CEO Dashboard', icon: 'LayoutDashboard', href: '/ceod/home' },
    { key: 'cto-home', name: 'CTO Dashboard', icon: 'Terminal', href: '/ctod/home' },
    { key: 'admin', name: 'Web Control Center', icon: 'Settings', href: '/admin' },
    { key: 'tickets', name: 'IT Support', icon: 'Ticket', href: '/ctod/operations/it-support' },
    { key: 'compliance', name: 'Compliance', icon: 'ShieldCheck', href: '/ctod/compliance' },
  ];

  const dockItems = isLoading ? defaultApps : (pinnedApps.length > 0 ? pinnedApps : defaultApps);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.set(e.clientX);
  }, [mouseX]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(Infinity);
  }, [mouseX]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = dockItems.findIndex((item) => item.key === active.id);
      const newIndex = dockItems.findIndex((item) => item.key === over.id);
      const newOrder = arrayMove(dockItems, oldIndex, newIndex);
      
      // If using pinned apps from database, update the order
      if (pinnedApps.length > 0) {
        await reorderPins(newOrder.map((item) => item.key));
      }
    }
  };

  const handleActionExecuted = (_action: unknown, result: { success: boolean; message: string }) => {
    // Could show a toast notification here
    console.log('Action executed:', result.message);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Minimized dock - compact pill to restore
  // On mobile, position on the right to avoid blocking sidebar signout
  if (isMinimized) {
    return (
      <motion.button
        className={`
          fixed z-50 rounded-full
          bg-white/90 dark:bg-slate-800/90
          backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50
          shadow-lg hover:shadow-xl
          flex items-center gap-2 font-medium
          text-slate-600 dark:text-slate-300
          transition-all duration-200 hover:scale-105
          ${isMobile
            ? 'bottom-4 right-4 p-3'  // Mobile: bottom-right, icon only
            : 'bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 text-sm'  // Desktop: center
          }
        `}
        onClick={() => setIsMinimized(false)}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ y: -2 }}
        title="Expand Dock"
      >
        <ChevronUp className="w-4 h-4" />
        {!isMobile && <span>Show Dock</span>}
        <Sparkles className={`text-primary ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
      </motion.button>
    );
  }

  return (
    <>
      <motion.div
        ref={dockRef}
        className="galaxy-dock"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        role="toolbar"
        aria-label="Command Dock"
      >
        {/* Clock Display */}
        <AnimatePresence>
          {showClock && (
            <motion.div
              className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-500 dark:text-slate-400"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="tabular-nums">{formatTime(clock)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <DockSearchBar />

        {/* Dashboard Switcher */}
        <DockDashboardSwitcher mouseX={mouseX} />

        {/* Divider */}
        <div className="dock-divider" />

        {/* Pinned Apps with Drag-and-Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={dockItems.map((item) => item.key)}
            strategy={horizontalListSortingStrategy}
          >
            {dockItems.map((item) => (
              <SortableDockItem
                key={item.key}
                item={item}
                mouseX={mouseX}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* External Links Section */}
        {externalLinks.length > 0 && (
          <>
            <div className="dock-divider" />
            <ExternalLinkGroup
              links={externalLinks}
              mouseX={mouseX}
            />
          </>
        )}

        {/* Quick Actions Section */}
        {quickActions.length > 0 && (
          <>
            <div className="dock-divider" />
            <QuickActionGroup
              actions={quickActions}
              mouseX={mouseX}
              onExecuted={handleActionExecuted}
            />
          </>
        )}

        {/* Utilities Section */}
        <div className="dock-divider" />

        {/* Galaxy Map Button */}
        <motion.button
          onClick={onOpenMap}
          className="galaxy-dock-item"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Galaxy Map (Navigate)"
          aria-label="Open Galaxy Map"
        >
          <Map className="w-6 h-6 text-primary" />
        </motion.button>

        {/* Command Palette Button */}
        <motion.button
          onClick={openPalette}
          className="galaxy-dock-item"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Command Palette (⌘K)"
          aria-label="Open Command Palette"
        >
          <Command className="w-6 h-6 text-slate-500 dark:text-slate-400" />
        </motion.button>

        {/* Minimize Button */}
        <motion.button
          onClick={() => setIsMinimized(true)}
          className="galaxy-dock-item dock-config-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Minimize Dock (Esc)"
          aria-label="Minimize Dock"
        >
          <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        </motion.button>

        {/* Config Button */}
        <motion.button
          onClick={() => setIsConfigOpen(true)}
          className="galaxy-dock-item dock-config-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Configure Dock"
          aria-label="Configure Dock Settings"
        >
          <Cog className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        </motion.button>
      </motion.div>

      {/* Configuration Modal */}
      <DockConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </>
  );
}
