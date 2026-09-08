import { memo, useCallback } from 'react';
import { LogOut, Settings, Menu, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SIDEBAR_CONSTANTS } from '../../hooks/useSidebar';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  display_name?: string;
  full_name?: string;
  role?: string;
  avatar_url?: string;
}

export interface SidebarOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export interface SidebarToggleButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  variant: 'mobile' | 'desktop';
  theme?: 'ceo' | 'cto' | 'admin' | 'aryx';
}

export interface SidebarHeaderProps {
  isExpanded: boolean;
  title: string;
  subtitle: string;
  logoSrc?: string;
  logoAlt?: string;
  children?: React.ReactNode;
  theme?: 'ceo' | 'cto' | 'admin' | 'aryx';
}

export interface SidebarUserProfileProps {
  profile: UserProfile | null;
  isExpanded: boolean;
  onSettingsClick?: () => void;
  onLogout: () => void;
  theme?: 'ceo' | 'cto' | 'admin' | 'aryx';
  roleLabel?: string;
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

const themeConfig = {
  aryx: {
    bg: 'bg-aryx-void',
    toggleBg: 'bg-aryx-void hover:bg-white/10',
    mobileToggleBg: 'bg-aryx-void',
    userHover: 'hover:bg-white/5',
    userAvatar: 'bg-aryx-accent text-white',
    userText: 'text-white/45',
    settingsHover: 'text-white/55 hover:bg-white/5 hover:text-[#F4F1EA]',
    logoutHover: 'text-white/55',
  },
  ceo: {
    bg: 'bg-gradient-to-b from-pink-600 to-pink-700',
    toggleBg: 'bg-pink-800 hover:bg-pink-700',
    mobileToggleBg: 'bg-pink-600',
    userHover: 'hover:bg-pink-800 active:bg-pink-900',
    userAvatar: 'bg-pink-300 text-pink-900',
    userText: 'text-pink-100',
    settingsHover: 'text-pink-100 hover:bg-pink-800 active:bg-pink-900',
    logoutHover: 'text-pink-100',
  },
  cto: {
    bg: 'bg-slate-900',
    toggleBg: 'bg-slate-800 hover:bg-slate-700',
    mobileToggleBg: 'bg-slate-800',
    userHover: 'hover:bg-slate-800 active:bg-slate-700',
    userAvatar: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    userText: 'text-slate-300',
    settingsHover: 'text-slate-400 hover:bg-slate-700 active:bg-slate-600',
    logoutHover: 'text-slate-400',
  },
  admin: {
    bg: 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950',
    toggleBg: 'bg-slate-700 hover:bg-slate-600',
    mobileToggleBg: 'bg-slate-800',
    userHover: 'hover:bg-slate-800',
    userAvatar: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    userText: 'text-slate-400',
    settingsHover: 'text-slate-400 hover:bg-slate-700 active:bg-slate-600',
    logoutHover: 'text-slate-400',
  },
} as const;

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Mobile overlay backdrop
 */
export const SidebarOverlay = memo(function SidebarOverlay({
  isVisible,
  onClose,
  onTouchStart,
  onTouchEnd,
}: SidebarOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[55] md:hidden',
        'bg-black/60 backdrop-blur-sm',
        'transition-opacity duration-300 ease-out',
        'touch-none'
      )}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-hidden="true"
      role="presentation"
    />
  );
});

/**
 * Sidebar toggle button (mobile and desktop variants)
 */
export const SidebarToggleButton = memo(function SidebarToggleButton({
  isExpanded,
  onToggle,
  variant,
  theme = 'aryx',
}: SidebarToggleButtonProps) {
  const config = themeConfig[theme];

  if (variant === 'mobile') {
    return (
      <button
        className={cn(
          // Position outside sidebar on the right
          'absolute top-4 -right-12 sm:-right-14',
          // Size and shape - ensure good touch target
          'p-2.5 sm:p-3 rounded-full min-w-[44px] min-h-[44px]',
          'flex items-center justify-center',
          config.mobileToggleBg,
          'text-[#F4F1EA] ring-1 ring-white/15 md:hidden z-50',
          'active:scale-[0.98] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
          'touch-manipulation select-none',
          // Safe area support
          'safe-top'
        )}
        onClick={onToggle}
        aria-label={isExpanded ? 'Close navigation menu' : 'Open navigation menu'}
        style={{
          // Ensure button respects safe areas
          marginTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {isExpanded ? (
          <X className="w-6 h-6" aria-hidden="true" />
        ) : (
          <Menu className="w-6 h-6" aria-hidden="true" />
        )}
      </button>
    );
  }

  // Desktop variant
  return (
    <button
      className={cn(
        'hidden md:flex items-center justify-center',
        'absolute top-6 right-0 transform translate-x-1/2',
        'w-8 h-8 rounded-full',
        config.toggleBg,
        'text-[#F4F1EA] ring-1 ring-white/15 z-50 cursor-pointer',
        'transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105',
        'focus:outline-none focus:ring-2 focus:ring-aryx-gold/40'
      )}
      onClick={onToggle}
      aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      {isExpanded ? (
        <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
      ) : (
        <ChevronsRight className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
});

/**
 * Sidebar header with logo and title
 */
export const SidebarHeader = memo(function SidebarHeader({
  isExpanded,
  title,
  subtitle,
  logoSrc,
  logoAlt = 'Logo',
  children,
}: SidebarHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6 md:mb-8 flex-shrink-0">
      <div
        className={cn(
          'flex items-center',
          isExpanded ? 'space-x-3' : 'justify-center'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            // Responsive logo size
            isExpanded ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-10 h-10',
            'rounded-xl flex items-center justify-center',
            'cursor-pointer overflow-hidden bg-aryx-void ring-1 ring-white/10 p-0',
            'active:scale-95 transition-transform touch-manipulation',
            'flex-shrink-0'
          )}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={logoAlt}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg" />
          )}
        </div>

        {/* Title */}
        {isExpanded && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="font-display text-sm font-semibold tracking-[0.28em] text-[#F4F1EA] truncate">{title}</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-aryx-gold truncate">
              {subtitle}
            </p>
          </div>
        )}
      </div>

      {/* Additional content (dashboard switcher, etc.) */}
      {children}
    </div>
  );
});

/**
 * User profile section at bottom of sidebar
 */
export const SidebarUserProfile = memo(function SidebarUserProfile({
  profile,
  isExpanded,
  onSettingsClick,
  onLogout,
  theme = 'aryx',
  roleLabel,
}: SidebarUserProfileProps) {
  const config = themeConfig[theme];

  // Get user initials
  const initials = profile?.display_name
    ? profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : theme === 'ceo'
    ? 'CEO'
    : theme === 'admin'
    ? 'AD'
    : theme === 'aryx'
    ? 'COS'
    : 'CTO';

  // Get display role
  const displayRole =
    roleLabel ||
    (profile?.role === 'ceo'
      ? 'Chief Executive Officer'
      : profile?.role === 'cto'
      ? 'Chief Technology Officer'
      : profile?.role === 'admin'
      ? 'Administrator'
      : 'Staff Member');

  const handleLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  return (
    <div className="mt-auto border-t border-white/10 pt-4 md:pt-6">
      {/* User Info */}
      <div
        className={cn(
          'flex items-center rounded-lg transition-colors cursor-pointer mb-2',
          isExpanded ? 'space-x-3 p-3' : 'justify-center p-2',
          config.userHover,
          'touch-manipulation',
          `min-h-[${SIDEBAR_CONSTANTS.MIN_TOUCH_TARGET + 12}px]`
        )}
        role="button"
        tabIndex={0}
        aria-label={`User profile: ${profile?.display_name || profile?.full_name || 'User'}`}
      >
        {/* Avatar */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0',
            config.userAvatar
          )}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="User avatar"
              className="w-full h-full rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className={cn(
                'text-sm font-bold',
                theme === 'ceo' ? 'text-pink-900' : 'text-white'
              )}
            >
              {initials}
            </span>
          )}
        </div>

        {/* User details */}
        {isExpanded && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profile?.display_name || profile?.full_name || 'User'}
            </p>
            <p className={cn('text-xs truncate', config.userText)}>
              {displayRole}
            </p>
          </div>
        )}
      </div>

      {/* Settings Button */}
      {onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className={cn(
            'flex items-center rounded-lg transition-all duration-200',
            'group w-full cursor-pointer mb-1',
            'touch-manipulation active:scale-[0.98]',
            `min-h-[${SIDEBAR_CONSTANTS.MIN_TOUCH_TARGET}px]`,
            isExpanded ? 'space-x-3 px-3 py-3 md:py-2.5' : 'justify-center py-3 md:py-2.5',
            config.settingsHover,
            'hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30'
          )}
          title="Account Settings"
        >
          <Settings
            className="w-5 h-5 md:w-4 md:h-4 transition-transform duration-200 group-hover:scale-105 flex-shrink-0"
            aria-hidden="true"
          />
          {isExpanded && <span className="text-sm font-medium">Settings</span>}
        </button>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className={cn(
          'flex items-center rounded-lg transition-all duration-200',
          'group w-full cursor-pointer',
          'touch-manipulation active:scale-[0.98]',
          `min-h-[${SIDEBAR_CONSTANTS.MIN_TOUCH_TARGET}px]`,
          isExpanded ? 'space-x-3 px-3 py-3 md:py-2.5' : 'justify-center py-3 md:py-2.5',
          config.logoutHover,
          'hover:bg-red-600 hover:text-white',
          'focus:outline-none focus:ring-2 focus:ring-red-500/50'
        )}
        title="Sign Out"
      >
        <LogOut
          className="w-5 h-5 md:w-4 md:h-4 transition-transform duration-200 group-hover:scale-105 flex-shrink-0"
          aria-hidden="true"
        />
        {isExpanded && <span className="text-sm font-medium">Sign Out</span>}
      </button>
    </div>
  );
});

/**
 * Admin role switcher component
 */
export const AdminRoleSwitcher = memo(function AdminRoleSwitcher({
  isExpanded,
  activeMode,
  onModeChange,
}: {
  isExpanded: boolean;
  activeMode: 'ceo' | 'cto';
  onModeChange: (mode: 'ceo' | 'cto') => void;
}) {
  if (!isExpanded) return null;

  return (
    <div className="mt-4 p-3 bg-white/10 rounded-lg">
      <p className="text-xs text-white/70 mb-2 font-medium">Admin View Mode</p>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onModeChange('ceo')}
          className={cn(
            'flex-1 px-3 py-2.5 rounded-lg text-xs font-medium',
            'transition-all duration-200 touch-manipulation',
            `active:scale-95 min-h-[${SIDEBAR_CONSTANTS.MIN_TOUCH_TARGET}px]`,
            activeMode === 'ceo'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          )}
        >
          CEO View
        </button>
        <button
          onClick={() => onModeChange('cto')}
          className={cn(
            'flex-1 px-3 py-2.5 rounded-lg text-xs font-medium',
            'transition-all duration-200 touch-manipulation',
            `active:scale-95 min-h-[${SIDEBAR_CONSTANTS.MIN_TOUCH_TARGET}px]`,
            activeMode === 'cto'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          )}
        >
          CTO View
        </button>
      </div>
    </div>
  );
});

/**
 * Search hint component for admin sidebar
 */
export const SidebarSearchHint = memo(function SidebarSearchHint({
  isExpanded,
  shortcut = '⌘K',
  onClick,
}: {
  isExpanded: boolean;
  shortcut?: string;
  onClick?: () => void;
}) {
  if (!isExpanded) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 flex w-full items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-[11px] text-white/45 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-aryx-gold/40 hover:text-[#F4F1EA] active:scale-[0.98]"
    >
      <span>Search workspace</span>
      <kbd className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
        {shortcut}
      </kbd>
    </button>
  );
});

export default {
  SidebarOverlay,
  SidebarToggleButton,
  SidebarHeader,
  SidebarUserProfile,
  AdminRoleSwitcher,
  SidebarSearchHint,
};
