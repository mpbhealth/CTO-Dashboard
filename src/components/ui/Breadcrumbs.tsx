import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  ceoNavigationItems,
  ctoNavigationItems,
  type NavItem,
  type NavSubItem,
} from '@/config/navigation';

interface BreadcrumbSegment {
  label: string;
  path: string;
  isLast: boolean;
}

/**
 * Builds a lookup map from route paths to labels using the navigation config.
 */
function buildPathLabelMap(items: NavItem[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const item of items) {
    map[item.path] = item.label;

    if (item.submenu) {
      for (const sub of item.submenu) {
        map[sub.path] = sub.label;
      }
    }
  }

  return map;
}

/**
 * Finds the matching nav item and sub-item for a given path.
 */
function findNavMatch(
  path: string,
  items: NavItem[]
): { parent?: NavItem; child?: NavSubItem } {
  for (const item of items) {
    if (item.submenu) {
      for (const sub of item.submenu) {
        if (path === sub.path || path.startsWith(sub.path + '/')) {
          return { parent: item, child: sub };
        }
      }
    }
    if (path === item.path || path.startsWith(item.path + '/')) {
      return { parent: item };
    }
  }
  return {};
}

export function Breadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  const breadcrumbs = useMemo((): BreadcrumbSegment[] => {
    const isCEO = path.startsWith('/ceod/');
    const isCTO = path.startsWith('/ctod/');

    if (!isCEO && !isCTO) return [];

    const navItems = isCEO ? ceoNavigationItems : ctoNavigationItems;
    const dashboardLabel = isCEO ? 'CEO Dashboard' : 'CTO Dashboard';
    const homePath = isCEO ? '/ceod/home' : '/ctod/home';

    const { parent, child } = findNavMatch(path, navItems);

    const segments: BreadcrumbSegment[] = [
      { label: dashboardLabel, path: homePath, isLast: false },
    ];

    if (parent) {
      if (child) {
        segments.push({ label: parent.label, path: parent.path, isLast: false });
        segments.push({ label: child.label, path: child.path, isLast: true });
      } else {
        segments.push({ label: parent.label, path: parent.path, isLast: true });
      }
    }

    // Mark the last item
    if (segments.length > 0) {
      segments[segments.length - 1].isLast = true;
    }

    return segments;
  }, [path]);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 overflow-x-auto"
    >
      <Home className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path} className="flex items-center gap-1.5 min-w-0">
          {index > 0 && (
            <ChevronRight
              className="w-3.5 h-3.5 flex-shrink-0 text-slate-400"
              aria-hidden="true"
            />
          )}
          {crumb.isLast ? (
            <span
              className="font-medium text-slate-900 dark:text-white truncate"
              aria-current="page"
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors truncate"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
