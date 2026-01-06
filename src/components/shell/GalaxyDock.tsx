import React, { useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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
} from 'lucide-react';
import { useShell } from './AppShell';
import { usePinnedApps } from '@/hooks/usePinnedApps';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { useQuickActions } from '@/hooks/useQuickActions';
import { DockSearchBar } from './DockSearchBar';
import { ExternalLinkGroup } from './ExternalLinkItem';
import { QuickActionGroup } from './QuickActionItem';
import { DockConfigModal } from './DockConfigModal';

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
};

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
 * Regular Dock Item (non-sortable) with Magnification Effect
 */
function DockItemButton({
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
    navigate(item.href);
  }, [navigate, item.href]);

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      className={`
        galaxy-dock-item dock-magnify relative
        ${isActive ? 'active' : ''}
      `}
      style={{
        width: size,
        height: size,
      }}
      whileTap={{ scale: 0.95 }}
      title={item.name}
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
 * GalaxyDock - Mac-style floating dock with magnification effect
 * 
 * Features:
 * - Bottom-center positioning with glassmorphism
 * - Hover magnification effect
 * - Active route indicator
 * - Badge counts for notifications
 * - Drag-and-drop reordering
 * - Inline search bar
 * - External project links
 * - Quick action buttons
 * - Configuration modal
 */
export function GalaxyDock({ onOpenMap }: GalaxyDockProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { openPalette } = useShell();
  const { pinnedApps, isLoading, reorderPins } = usePinnedApps();
  const { externalLinks } = useExternalLinks();
  const { quickActions } = useQuickActions();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
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

  // Default apps if no pinned apps loaded yet
  const defaultApps: DockItem[] = [
    { key: 'ceo-home', name: 'CEO Dashboard', icon: 'LayoutDashboard', href: '/ceo' },
    { key: 'cto-home', name: 'CTO Dashboard', icon: 'Terminal', href: '/cto' },
    { key: 'orbit', name: 'MPB Orbit', icon: 'Orbit', href: '/orbit' },
    { key: 'tickets', name: 'IT Support', icon: 'Ticket', href: '/tickets' },
    { key: 'settings', name: 'Settings', icon: 'Settings', href: '/settings' },
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

  const handleActionExecuted = (action: unknown, result: { success: boolean; message: string }) => {
    // Could show a toast notification here
    console.log('Action executed:', result.message);
  };

  return (
    <>
      <motion.div
        className="galaxy-dock"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* Search Bar */}
        <DockSearchBar />

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
          title="Galaxy Map"
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
        >
          <Command className="w-6 h-6 text-slate-500 dark:text-slate-400" />
        </motion.button>

        {/* Config Button */}
        <motion.button
          onClick={() => setIsConfigOpen(true)}
          className="galaxy-dock-item dock-config-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Configure Dock"
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
