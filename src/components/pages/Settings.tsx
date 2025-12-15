import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  User,
  Mail,
  Shield,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { NotificationSettings } from '../notifications';

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, isDemoMode, signOut } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isCEORoute = location.pathname.startsWith('/ceod');
  const backPath = isCEORoute ? '/ceod/home' : '/ctod/home';

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { strength: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isDemoMode) {
      setError('Password cannot be changed in demo mode');
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password strength
    const validationErrors = validatePassword(newPassword);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setIsLoading(true);

    try {
      // First, re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-4 sm:p-6 md:p-8"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate(backPath)}
            className="
              flex items-center gap-2 
              text-gray-600 hover:text-gray-900 
              mb-4 transition-colors
              py-2 -ml-2 px-2 rounded-lg
              hover:bg-gray-100 active:bg-gray-200
              touch-manipulation min-h-[44px]
            "
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg">
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-sm text-gray-500">Manage your account security</p>
            </div>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Profile Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="text-gray-900 font-medium text-sm sm:text-base truncate">
                  {user?.email || profile?.email || 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                <p className="text-gray-900 font-medium text-sm sm:text-base truncate">
                  {profile?.full_name || profile?.display_name || 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <Shield className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                <p className="text-gray-900 font-medium text-sm sm:text-base capitalize">
                  {profile?.role || 'Staff'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            Change Password
          </h2>

          {isDemoMode && (
            <div className="mb-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium text-sm">Demo Mode Active</p>
                <p className="text-amber-700 text-xs sm:text-sm">Password changes are disabled in demo mode.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-5">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isDemoMode || isLoading}
                  className="
                    w-full px-4 py-3.5 pr-14 
                    border border-gray-200 rounded-xl 
                    focus:ring-2 focus:ring-sky-500 focus:border-transparent 
                    transition-all 
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    text-base min-h-[52px]
                  "
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2 
                    p-2 rounded-lg
                    text-gray-400 hover:text-gray-600 hover:bg-gray-100
                    transition-colors touch-manipulation
                    min-h-[40px] min-w-[40px]
                    flex items-center justify-center
                  "
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isDemoMode || isLoading}
                  className="
                    w-full px-4 py-3.5 pr-14 
                    border border-gray-200 rounded-xl 
                    focus:ring-2 focus:ring-sky-500 focus:border-transparent 
                    transition-all 
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    text-base min-h-[52px]
                  "
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2 
                    p-2 rounded-lg
                    text-gray-400 hover:text-gray-600 hover:bg-gray-100
                    transition-colors touch-manipulation
                    min-h-[40px] min-w-[40px]
                    flex items-center justify-center
                  "
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.strength === 1 ? 'text-red-500' :
                      passwordStrength.strength === 2 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1.5 mt-2">
                    <li className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                      <span className="w-4">{newPassword.length >= 8 ? '✓' : '○'}</span>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      <span className="w-4">{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span>
                      One uppercase letter
                    </li>
                    <li className={`flex items-center gap-1.5 ${/[a-z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      <span className="w-4">{/[a-z]/.test(newPassword) ? '✓' : '○'}</span>
                      One lowercase letter
                    </li>
                    <li className={`flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      <span className="w-4">{/[0-9]/.test(newPassword) ? '✓' : '○'}</span>
                      One number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isDemoMode || isLoading}
                  className={`
                    w-full px-4 py-3.5 pr-14 
                    border rounded-xl 
                    focus:ring-2 focus:ring-sky-500 focus:border-transparent 
                    transition-all 
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    text-base min-h-[52px]
                    ${confirmPassword && newPassword !== confirmPassword 
                      ? 'border-red-300 bg-red-50' 
                      : confirmPassword && newPassword === confirmPassword 
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200'
                    }
                  `}
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2 
                    p-2 rounded-lg
                    text-gray-400 hover:text-gray-600 hover:bg-gray-100
                    transition-colors touch-manipulation
                    min-h-[40px] min-w-[40px]
                    flex items-center justify-center
                  "
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-2 text-sm text-red-500">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="mt-2 text-sm text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isDemoMode || isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="
                w-full py-4 px-4 
                bg-gradient-to-r from-sky-500 to-blue-600 
                text-white font-semibold rounded-xl 
                shadow-lg hover:shadow-xl 
                hover:from-sky-600 hover:to-blue-700 
                focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg
                active:scale-[0.98]
                min-h-[52px]
                touch-manipulation
                text-sm sm:text-base
              "
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating Password...
                </span>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-4 sm:mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Security Tips</h3>
          <ul className="text-xs sm:text-sm text-blue-700 space-y-1.5">
            <li>• Use a unique password that you don't use for other accounts</li>
            <li>• Never share your password with anyone</li>
            <li>• Consider using a password manager</li>
            <li>• Change your password periodically for better security</li>
          </ul>
        </div>

        {/* Notification Settings */}
        <NotificationSettings className="mt-4 sm:mt-6" />

        {/* Sign Out Section */}
        <div className="mt-4 sm:mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LogOut className="w-5 h-5 text-gray-400" />
            Sign Out
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Sign out of your account on this device. You will need to sign in again to access the dashboard.
          </p>
          <button
            onClick={async () => {
              try {
                // Clear access PIN session storage
                sessionStorage.removeItem('mpb_access_verified');
                await signOut();
                navigate('/login');
              } catch (error) {
                console.error('Error signing out:', error);
                navigate('/login');
              }
            }}
            className="
              w-full py-4 px-4 
              bg-gradient-to-r from-red-500 to-red-600 
              text-white font-semibold rounded-xl 
              shadow-lg hover:shadow-xl 
              hover:from-red-600 hover:to-red-700 
              focus:ring-2 focus:ring-red-500 focus:ring-offset-2 
              transition-all duration-200
              active:scale-[0.98]
              min-h-[52px]
              touch-manipulation
              text-sm sm:text-base
              flex items-center justify-center gap-2
            "
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
