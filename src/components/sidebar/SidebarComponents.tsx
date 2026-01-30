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
  theme?: 'ceo' | 'cto' | 'admin';
}

export interface SidebarHeaderProps {
  isExpanded: boolean;
  title: string;
  subtitle: string;
  logoSrc?: string;
  logoAlt?: string;
  children?: React.ReactNode;
  theme?: 'ceo' | 'cto' | 'admin';
}

export interface SidebarUserProfileProps {
  profile: UserProfile | null;
  isExpanded: boolean;
  onSettingsClick?: () => void;
  onLogout: () => void;
  theme?: 'ceo' | 'cto' | 'admin';
  roleLabel?: string;
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

const themeConfig = {
  ceo: {
    bg: 'bg-gradient-to-b from-indigo-600 to-indigo-700',
    toggleBg: 'bg-indigo-800 hover:bg-indigo-700',
    mobileToggleBg: 'bg-indigo-600',
    userHover: 'hover:bg-indigo-800 active:bg-indigo-900',
    userAvatar: 'bg-indigo-300 text-indigo-900',
    userText: 'text-indigo-100',
    settingsHover: 'text-indigo-100 hover:bg-indigo-800 active:bg-indigo-900',
    logoutHover: 'text-indigo-100',
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
        'fixed inset-0 z-30 md:hidden',
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
  theme = 'cto',
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
          'text-white md:hidden z-50',
          'shadow-lg active:scale-95 transition-transform',
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
        'text-white z-50 cursor-pointer',
        'transition-all duration-200 hover:scale-110',
        'focus:outline-none focus:ring-2 focus:ring-white/50'
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
            'rounded-xl flex items-center justify-center shadow-lg',
            'cursor-pointer bg-white p-1 sm:p-1.5',
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
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg" />
          )}
        </div>

        {/* Title */}
        {isExpanded && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">{title}</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium truncate">
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
  theme = 'cto',
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
    <div className="mt-auto pt-4 md:pt-6 border-t border-white/10">
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
              alt=""
              className="w-full h-full rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className={cn(
                'text-sm font-bold',
                theme === 'ceo' ? 'text-indigo-900' : 'text-white'
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
              ? 'bg-indigo-500 text-white shadow-md'
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
}: {
  isExpanded: boolean;
  shortcut?: string;
}) {
  if (!isExpanded) return null;

  return (
    <div className="mb-4 px-3 py-2 bg-slate-800/50 rounded-lg text-xs text-slate-400 flex items-center gap-2">
      <span>
        Press{' '}
        <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">
          {shortcut}
        </kbd>{' '}
        to search
      </span>
    </div>
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
