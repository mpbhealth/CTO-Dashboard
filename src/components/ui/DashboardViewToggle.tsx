import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Code2, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function DashboardViewToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  if (!profile || (profile.role !== 'ceo' && profile.role !== 'admin')) {
    return null;
  }

  const isOnCEODashboard = location.pathname.startsWith('/ceod');
  const isOnCTODashboard = location.pathname.startsWith('/ctod');

  const handleToggle = () => {
    if (isOnCEODashboard) {
      navigate('/ctod/home');
    } else {
      navigate('/ceod/home');
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 shadow-md hover:shadow-lg"
      title={isOnCEODashboard ? 'Switch to CTO View' : 'Switch to CEO View'}
    >
      {isOnCEODashboard ? (
        <>
          <Code2 size={16} />
          <span className="hidden sm:inline">View CTO</span>
        </>
      ) : (
        <>
          <Home size={16} />
          <span className="hidden sm:inline">Back to CEO</span>
        </>
      )}
      <ArrowLeftRight size={14} className="opacity-75" />
    </button>
  );
}
