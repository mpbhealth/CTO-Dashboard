// ============================================
// NotificationBell Component
// Bell icon with badge for notification count
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
}

interface PanelPosition {
  top: number;
  left: number;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const { unreadCount, criticalCount, permissionStatus, requestPermission } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({ top: 0, left: 0 });
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevUnreadCount = useRef(unreadCount);

  // Calculate panel position based on bell button location
  const calculatePosition = useCallback(() => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      const panelWidth = 384; // max-width of panel (sm:w-96 = 384px)
      const viewportWidth = window.innerWidth;
      
      // Position panel to the right of the button, or adjust if it would overflow
      let left = rect.right + 8; // 8px gap from button
      
      // If panel would overflow right edge, position it differently
      if (left + panelWidth > viewportWidth - 16) {
        // Try positioning from button's left edge extending right
        left = Math.max(16, rect.left);
      }
      
      setPanelPosition({
        top: rect.top,
        left: left,
      });
    }
  }, []);

  // Animate bell when new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Recalculate position when panel opens or window resizes
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true);
      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
      };
    }
  }, [isOpen, calculatePosition]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        bellRef.current &&
        panelRef.current &&
        !bellRef.current.contains(event.target as Node) &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleBellClick = async () => {
    // Request permission if not granted
    if (permissionStatus === 'default') {
      await requestPermission();
    }
    setIsOpen(!isOpen);
  };

  const displayCount = criticalCount > 0 ? criticalCount : unreadCount;
  const hasCritical = criticalCount > 0;
  const BellIcon = isAnimating || hasCritical ? BellRing : Bell;

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className={`
          relative p-2 rounded-lg transition-all duration-200
          hover:bg-gray-100 active:bg-gray-200
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          ${isOpen ? 'bg-gray-100' : ''}
          ${isAnimating ? 'animate-wiggle' : ''}
        `}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BellIcon
          className={`
            w-5 h-5 transition-colors duration-200
            ${hasCritical ? 'text-red-600' : 'text-gray-600 hover:text-gray-900'}
            ${isAnimating ? 'animate-pulse' : ''}
          `}
        />
        
        {/* Badge */}
        {displayCount > 0 && (
          <span
            className={`
              absolute -top-0.5 -right-0.5
              min-w-[18px] h-[18px] px-1
              flex items-center justify-center
              text-[10px] font-bold text-white
              rounded-full
              ${hasCritical ? 'bg-red-600 animate-pulse' : 'bg-indigo-600'}
              transform transition-transform duration-200
              ${isAnimating ? 'scale-110' : 'scale-100'}
            `}
          >
            {displayCount > 99 ? '99+' : displayCount}
          </span>
        )}
      </button>

      {/* Notification Center Panel - Rendered via Portal to escape sidebar DOM entirely */}
      {isOpen && createPortal(
        <div
          ref={panelRef}
          className="animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            position: 'fixed',
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`,
            zIndex: 99999,
            maxHeight: 'calc(100vh - 100px)',
          }}
        >
          <NotificationCenter onClose={() => setIsOpen(false)} />
        </div>,
        document.body
      )}
    </div>
  );
}

// Add wiggle animation to tailwind (via inline style for now)
const style = document.createElement('style');
style.textContent = `
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-10deg); }
    50% { transform: rotate(10deg); }
    75% { transform: rotate(-5deg); }
  }
  .animate-wiggle {
    animation: wiggle 0.5s ease-in-out;
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('#notification-bell-styles')) {
  style.id = 'notification-bell-styles';
  document.head.appendChild(style);
}

