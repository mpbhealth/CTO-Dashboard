import { memo, useCallback, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SIDEBAR_CONSTANTS } from '../../hooks/useSidebar';

// ============================================================================
// TYPES
// ============================================================================

export interface NavItemData {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  urgent?: boolean;
  submenu?: SubNavItem[];
}

export interface SubNavItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  urgent?: boolean;
}

export interface SidebarNavItemProps {
  item: NavItemData;
  isActive: boolean;
  isExpanded: boolean;
  sidebarExpanded: boolean;
  onNavigate: (path: string, itemId: string) => void;
  onToggleSubmenu: (itemId: string) => void;
  theme?: 'ceo' | 'cto' | 'admin';
  focusedIndex?: number;
  itemIndex?: number;
}

export interface SidebarSubItemProps {
  item: SubNavItem;
  isActive: boolean;
  onNavigate: (path: string, itemId: string) => void;
  theme?: 'ceo' | 'cto' | 'admin';
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

const themeStyles = {
  ceo: {
    active: 'bg-indigo-900 font-semibold shadow-lg text-white',
    hover: 'text-indigo-50 hover:bg-indigo-800 hover:text-white active:bg-indigo-900',
    submenuActive: 'bg-indigo-900 font-semibold text-white',
    submenuHover: 'text-indigo-100 hover:bg-indigo-800 hover:text-white active:bg-indigo-900',
    submenuBorder: 'border-indigo-800',
    iconActive: 'text-white',
  },
  cto: {
    active: 'bg-indigo-600 font-semibold shadow-lg shadow-indigo-500/25 text-white',
    hover: 'text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-700',
    submenuActive: 'bg-indigo-600 font-semibold text-white',
    submenuHover: 'text-slate-400 hover:bg-slate-800 hover:text-white active:bg-slate-700',
    submenuBorder: 'border-slate-700',
    iconActive: 'text-white',
  },
  admin: {
    active: 'bg-primary-500/10 border-l-2 border-primary-400 text-white font-medium',
    hover: 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
    submenuActive: 'bg-primary-500/10 text-primary-400 font-medium',
    submenuHover: 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
    submenuBorder: 'border-slate-700',
    iconActive: 'text-primary-400',
  },
} as const;

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Badge component for navigation items
 */
const NavBadge = memo(function NavBadge({ 
  value, 
  urgent = false 
}: { 
  value: string | number; 
  urgent?: boolean;
}) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs font-medium rounded-full transition-colors',
        urgent
          ? 'bg-red-500/20 text-red-400 animate-pulse'
          : 'bg-slate-700 text-slate-300'
      )}
      aria-label={urgent ? `${value} urgent items` : `${value} items`}
    >
      {value}
    </span>
  );
});

/**
 * Submenu item component
 */
const SidebarSubItem = memo(function SidebarSubItem({
  item,
  isActive,
  onNavigate,
  theme = 'cto',
}: SidebarSubItemProps) {
  const styles = themeStyles[theme];

  const handleClick = useCallback(() => {
    onNavigate(item.path, item.id);
  }, [item.path, item.id, onNavigate]);

  return (
    <li>
      <button
        onClick={handleClick}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center w-full px-3 py-2.5 md:py-2',
          'rounded-lg text-sm transition-all duration-200',
          'text-left touch-manipulation',
          'active:scale-[0.98] min-h-[44px]',
          isActive ? styles.submenuActive : styles.submenuHover
        )}
      >
        {item.icon && (
          <item.icon 
            className={cn(
              'w-4 h-4 mr-2 flex-shrink-0',
              isActive && styles.iconActive
            )} 
          />
        )}
        <span className="flex-1 text-left truncate">{item.label}</span>
        {item.badge !== undefined && item.badge !== null && (
          <NavBadge value={item.badge} urgent={item.urgent} />
        )}
      </button>
    </li>
  );
});

/**
 * Main navigation item component with submenu support
 */
export const SidebarNavItem = memo(function SidebarNavItem({
  item,
  isActive,
  isExpanded,
  sidebarExpanded,
  onNavigate,
  onToggleSubmenu,
  theme = 'cto',
  focusedIndex = -1,
  itemIndex = -1,
}: SidebarNavItemProps) {
  const styles = themeStyles[theme];
  const Icon = item.icon;
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const isFocused = focusedIndex === itemIndex;

  // Handle main item click
  const handleClick = useCallback(() => {
    if (hasSubmenu && sidebarExpanded) {
      onToggleSubmenu(item.id);
    } else {
      onNavigate(item.path, item.id);
    }
  }, [hasSubmenu, sidebarExpanded, item.id, item.path, onNavigate, onToggleSubmenu]);

  // Handle submenu item navigation
  const handleSubNavigate = useCallback((path: string, id: string) => {
    onNavigate(path, id);
  }, [onNavigate]);

  // Determine if this item (not including submenu) should show as active
  const showAsActive = isActive && !hasSubmenu;

  // Button styles
  const buttonStyles = useMemo(() => cn(
    'flex items-center w-full px-3 py-3 md:py-2.5',
    'rounded-lg transition-all duration-200',
    'group text-left cursor-pointer',
    'touch-manipulation active:scale-[0.98]',
    `min-h-[${SIDEBAR_CONSTANTS.MIN_TOUCH_TARGET}px]`,
    showAsActive ? styles.active : styles.hover,
    !sidebarExpanded && 'justify-center',
    isFocused && 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent'
  ), [showAsActive, styles, sidebarExpanded, isFocused]);

  return (
    <li
      className={cn(!sidebarExpanded && 'flex justify-center')}
    >
      <button
        onClick={handleClick}
        aria-current={showAsActive ? 'page' : undefined}
        aria-expanded={hasSubmenu ? isExpanded : undefined}
        title={item.label}
        className={buttonStyles}
      >
        {/* Icon with indicator for collapsed state */}
        <div className="relative flex-shrink-0">
          <Icon
            className={cn(
              'w-5 h-5 md:w-4 md:h-4',
              'transition-transform duration-200',
              showAsActive ? 'scale-110' : 'group-hover:scale-105',
              showAsActive && styles.iconActive
            )}
          />
          {/* Urgent indicator dot for collapsed state */}
          {item.urgent && item.badge && !sidebarExpanded && (
            <span 
              className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
              aria-hidden="true"
            >
              <span className="absolute inset-0 w-full h-full bg-red-500 rounded-full animate-ping" />
            </span>
          )}
        </div>

        {/* Label and chevron */}
        {sidebarExpanded && (
          <>
            <span className="ml-3 text-sm font-medium flex-1 truncate">
              {item.label}
            </span>

            {/* Badge */}
            {item.badge !== undefined && item.badge !== null && (
              <NavBadge value={item.badge} urgent={item.urgent} />
            )}

            {/* Submenu chevron */}
            {hasSubmenu && (
              <ChevronRight
                className={cn(
                  'w-4 h-4 ml-2 transition-transform duration-200 flex-shrink-0',
                  isExpanded && 'rotate-90'
                )}
                aria-hidden="true"
              />
            )}
          </>
        )}
      </button>

      {/* Submenu */}
      {hasSubmenu && isExpanded && sidebarExpanded && (
        <ul
          aria-label={`${item.label} submenu`}
          className={cn(
            'ml-4 mt-1 space-y-0.5 pl-3 border-l',
            styles.submenuBorder,
            'animate-in slide-in-from-top-2 duration-200'
          )}
        >
          {item.submenu!.map((subItem) => (
            <SidebarSubItem
              key={subItem.id}
              item={subItem}
              isActive={location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')}
              onNavigate={handleSubNavigate}
              theme={theme}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

/**
 * Category header component
 */
export const SidebarCategoryHeader = memo(function SidebarCategoryHeader({
  title,
  isExpanded,
  theme = 'cto',
}: {
  title: string;
  isExpanded: boolean;
  theme?: 'ceo' | 'cto' | 'admin';
}) {
  if (!isExpanded) return null;

  const colorClass = {
    ceo: 'text-indigo-200',
    cto: 'text-slate-400',
    admin: 'text-slate-500',
  }[theme];

  return (
    <h3
      className={cn(
        'text-xs font-semibold uppercase tracking-wider mb-2 md:mb-3 px-2',
        colorClass
      )}
    >
      {title}
    </h3>
  );
});

export default SidebarNavItem;
