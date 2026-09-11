import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  ceoNavigationItems,
  findNavMatch,
} from '@/config/navigation';

interface BreadcrumbSegment {
  label: string;
  path: string;
  isLast: boolean;
}

export function Breadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  const breadcrumbs = useMemo((): BreadcrumbSegment[] => {
    if (path === '/' || path === '/login') return [];

    const navItems = ceoNavigationItems;
    const dashboardLabel = 'ARYX CEO';
    const homePath = '/home';

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
      className="mb-4 hidden items-center gap-1.5 overflow-x-auto px-4 pt-4 text-sm text-aryx-muted sm:flex"
    >
      <Home className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path} className="flex items-center gap-1.5 min-w-0">
          {index > 0 && (
            <ChevronRight
              className="h-3.5 w-3.5 flex-shrink-0 text-aryx-faint"
              aria-hidden="true"
            />
          )}
          {crumb.isLast ? (
            <span
              className="truncate font-medium text-aryx-ink"
              aria-current="page"
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="truncate text-aryx-muted transition-colors hover:text-aryx-ink"
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
