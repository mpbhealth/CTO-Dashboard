import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { ExternalLink } from '@/hooks/useExternalLinks';

interface ExternalLinkItemProps {
  link: ExternalLink;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  onContextMenu?: (e: React.MouseEvent, link: ExternalLink) => void;
}

/**
 * Get Lucide icon component by name
 */
function getIconComponent(iconName: string): React.ElementType {
  const icons = LucideIcons as Record<string, React.ElementType>;
  return icons[iconName] || LucideIcons.Globe;
}

/**
 * ExternalLinkItem - Dock item for external project links
 * 
 * Features:
 * - Magnification effect on hover (like macOS dock)
 * - Opens in new browser tab
 * - Tooltip with link name
 * - Context menu for edit/delete
 * - External link indicator badge
 */
export function ExternalLinkItem({ link, mouseX, onContextMenu }: ExternalLinkItemProps) {
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

  const Icon = getIconComponent(link.icon);

  const handleClick = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, link);
  };

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className="dock-external-link dock-magnify relative"
      style={{
        width: size,
        height: size,
      }}
      whileTap={{ scale: 0.95 }}
      title={`${link.name} (opens in new tab)`}
    >
      {/* Icon */}
      <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
      
      {/* External link indicator */}
      <span className="dock-external-badge">
        <ExternalLinkIcon className="w-2.5 h-2.5" />
      </span>

      {/* Hover tooltip */}
      <motion.div
        className="dock-item-tooltip"
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
      >
        {link.name}
      </motion.div>
    </motion.button>
  );
}

/**
 * ExternalLinkGroup - Wrapper for multiple external links with label
 */
export function ExternalLinkGroup({ 
  links, 
  mouseX,
  onContextMenu,
}: { 
  links: ExternalLink[];
  mouseX: ReturnType<typeof useMotionValue<number>>;
  onContextMenu?: (e: React.MouseEvent, link: ExternalLink) => void;
}) {
  if (links.length === 0) return null;

  return (
    <>
      {links.map((link) => (
        <ExternalLinkItem
          key={link.id}
          link={link}
          mouseX={mouseX}
          onContextMenu={onContextMenu}
        />
      ))}
    </>
  );
}

