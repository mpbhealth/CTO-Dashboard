import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye } from 'lucide-react';

export function ViewingContextBadge() {
  const location = useLocation();
  const { profile } = useAuth();

  if (!profile) {
    return null;
  }

  const isOnCEODashboard = location.pathname.startsWith('/ceod');
  const isOnCTODashboard = location.pathname.startsWith('/ctod');
  const isOnSharedDashboard = location.pathname.startsWith('/shared');

  const isCEO = profile.role === 'ceo' || profile.role === 'admin';
  const isCTO = profile.role === 'cto' || profile.role === 'staff';

  let badgeText = '';
  let badgeClass = '';

  if (isCEO && isOnCTODashboard) {
    badgeText = 'CEO (Viewing CTO)';
    badgeClass = 'bg-gradient-to-r from-pink-600 to-teal-600 text-white';
  } else if (isCEO && isOnCEODashboard) {
    badgeText = 'CEO';
    badgeClass = 'bg-gradient-to-r from-pink-600 to-rose-600 text-white';
  } else if (isCTO && isOnCTODashboard) {
    badgeText = 'CTO';
    badgeClass = 'bg-blue-600 text-white';
  } else if (isOnSharedDashboard) {
    badgeText = isCEO ? 'CEO (Shared)' : 'CTO (Shared)';
    badgeClass = 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white';
  }

  if (!badgeText) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${badgeClass} shadow-sm`}>
      {(isCEO && isOnCTODashboard) && <Eye size={12} />}
      {badgeText}
    </div>
  );
}
