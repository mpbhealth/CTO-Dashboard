import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Check, Loader2 } from 'lucide-react';
import type { QuickAction } from '@/hooks/useQuickActions';
import { executeQuickAction } from '@/hooks/useQuickActions';

interface QuickActionItemProps {
  action: QuickAction;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  onContextMenu?: (e: React.MouseEvent, action: QuickAction) => void;
  onExecuted?: (action: QuickAction, result: { success: boolean; message: string }) => void;
}

/**
 * Get Lucide icon component by name
 */
function getIconComponent(iconName: string): React.ElementType {
  const icons = LucideIcons as Record<string, React.ElementType>;
  return icons[iconName] || LucideIcons.Zap;
}

/**
 * Get color classes based on action color
 */
function getColorClasses(color: string): string {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/20 text-primary hover:bg-primary/30',
    secondary: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50',
    danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
  };
  return colorMap[color] || colorMap.primary;
}

/**
 * QuickActionItem - Dock item for quick action buttons
 * 
 * Features:
 * - Magnification effect on hover
 * - Visual feedback during action execution
 * - Success/error state indicators
 * - Color-coded based on action type
 * - Context menu for edit/delete
 */
export function QuickActionItem({ action, mouseX, onContextMenu, onExecuted }: QuickActionItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculate distance from mouse for magnification
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Scale based on distance
  const baseSize = 48;
  const maxScale = 1.5;
  const magnifyRange = 150;

  const scale = useTransform(distance, [-magnifyRange, 0, magnifyRange], [1, maxScale, 1]);
  const springScale = useSpring(scale, { mass: 0.1, stiffness: 150, damping: 12 });
  const size = useTransform(springScale, (s) => s * baseSize);

  const Icon = getIconComponent(action.icon);
  const colorClasses = getColorClasses(action.color);

  const handleClick = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    try {
      const result = await executeQuickAction(action);
      
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      }

      onExecuted?.(action, result);
    } catch (err) {
      console.error('Failed to execute action:', err);
      onExecuted?.(action, { success: false, message: 'Action failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, action);
  };

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`dock-quick-action dock-magnify relative ${colorClasses}`}
      style={{
        width: size,
        height: size,
      }}
      whileTap={{ scale: 0.95 }}
      title={action.description || action.label}
      disabled={isExecuting}
    >
      {/* Icon with states */}
      {isExecuting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : showSuccess ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <Check className="w-5 h-5 text-emerald-500" />
        </motion.div>
      ) : (
        <Icon className="w-5 h-5" />
      )}

      {/* Notification badge (for actions that show notifications) */}
      {action.show_notification && !isExecuting && !showSuccess && (
        <span className="dock-action-indicator" />
      )}

      {/* Hover tooltip */}
      <motion.div
        className="dock-item-tooltip"
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
      >
        {action.label}
      </motion.div>
    </motion.button>
  );
}

/**
 * QuickActionGroup - Wrapper for multiple quick actions
 */
export function QuickActionGroup({
  actions,
  mouseX,
  onContextMenu,
  onExecuted,
}: {
  actions: QuickAction[];
  mouseX: ReturnType<typeof useMotionValue<number>>;
  onContextMenu?: (e: React.MouseEvent, action: QuickAction) => void;
  onExecuted?: (action: QuickAction, result: { success: boolean; message: string }) => void;
}) {
  if (actions.length === 0) return null;

  return (
    <>
      {actions.map((action) => (
        <QuickActionItem
          key={action.id}
          action={action}
          mouseX={mouseX}
          onContextMenu={onContextMenu}
          onExecuted={onExecuted}
        />
      ))}
    </>
  );
}

