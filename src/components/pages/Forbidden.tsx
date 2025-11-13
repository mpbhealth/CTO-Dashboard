import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Forbidden() {
  const navigate = useNavigate();
  const { role, user } = useAuth();

  const getDefaultPath = () => {
    if (role === 'ceo') return '/ceod/home';
    if (role === 'cto' || role === 'admin' || role === 'staff') return '/ctod/home';
    return '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-lg text-gray-600 mb-6">
          You don't have permission to access this page
        </p>

        {user && role && (
          <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-lg text-left">
            <p className="text-sm text-pink-900 mb-1">
              <span className="font-semibold">Current Role:</span>{' '}
              <span className="capitalize">{role}</span>
            </p>
            <p className="text-xs text-pink-700 mt-2">
              You are trying to access a page that requires different permissions.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(getDefaultPath())}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            <Home className="w-5 h-5" />
            Go to My Dashboard
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
