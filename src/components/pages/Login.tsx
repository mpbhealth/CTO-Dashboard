import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Building2, AlertCircle, CheckCircle, User, KeyRound, Briefcase, Code2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginProps {
  onLoginSuccess: () => void;
}

type UserRole = 'ceo' | 'cto' | null;

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setSuccess('Login successful! Redirecting...');
        window.location.href = '/auth/callback';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!selectedRole) {
        throw new Error('Please select a role (CEO or CTO) before registering.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const VALID_PASSCODE = '738294';
      if (passcode !== VALID_PASSCODE) {
        throw new Error('Invalid passcode. Please enter the correct passcode to register.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: selectedRole,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const orgId = '00000000-0000-0000-0000-000000000000';

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            email: email,
            full_name: name,
            role: selectedRole,
            org_id: orgId,
            display_name: name
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        setSuccess(`Registration successful as ${selectedRole.toUpperCase()}! You can now log in with your credentials.`);
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
        setPasscode('');
        setName('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    setSuccess(null);
  };

  const getRoleColor = (role: UserRole) => {
    if (role === 'ceo') return 'from-emerald-600 to-teal-600';
    if (role === 'cto') return 'from-sky-600 to-blue-600';
    return 'from-slate-600 to-gray-600';
  };

  const getRoleBorderColor = (role: UserRole) => {
    if (role === 'ceo') return 'border-emerald-500';
    if (role === 'cto') return 'border-pink-500';
    return 'border-slate-500';
  };

  const getRoleTextColor = (role: UserRole) => {
    if (role === 'ceo') return 'text-emerald-600';
    if (role === 'cto') return 'text-pink-600';
    return 'text-slate-600';
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-4xl"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
            >
              <Building2 className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Welcome to MPB Health
            </h1>
            <p className="text-slate-300 text-lg">
              Select your role to continue
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.button
              onClick={() => handleRoleSelect('ceo')}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-transparent hover:border-pink-500 transition-all duration-300"
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-pink-500/50 transition-shadow">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">CEO Portal</h2>
                <p className="text-slate-600 mb-6">
                  Executive dashboard with strategic insights, marketing analytics, and board-level reporting
                </p>
                <div className="flex items-center justify-center text-pink-600 font-medium group-hover:text-pink-700">
                  Continue as CEO
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => handleRoleSelect('cto')}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-transparent hover:border-pink-500 transition-all duration-300"
            >
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-sky-500/50 transition-shadow">
                  <Code2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">CTO Portal</h2>
                <p className="text-slate-600 mb-6">
                  Technical dashboard with engineering metrics, system monitoring, and operational insights
                </p>
                <div className="flex items-center justify-center text-pink-600 font-medium group-hover:text-pink-700">
                  Continue as CTO
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2025 MPB Health. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${selectedRole === 'ceo' ? 'from-emerald-900 via-teal-800 to-slate-900' : 'from-slate-900 via-slate-800 to-sky-900'} flex items-center justify-center p-4`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => setSelectedRole(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors text-sm flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Change Role</span>
            </button>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`w-16 h-16 bg-gradient-to-br ${getRoleColor(selectedRole)} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
            >
              {selectedRole === 'ceo' ? (
                <Briefcase className="w-8 h-8 text-white" />
              ) : (
                <Code2 className="w-8 h-8 text-white" />
              )}
            </motion.div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getRoleTextColor(selectedRole)} bg-${selectedRole === 'ceo' ? 'emerald' : 'sky'}-100`}>
              {selectedRole === 'ceo' ? 'CEO Portal' : 'CTO Portal'}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-600">
              {isSignUp ? `Sign up to access the MPB Health ${selectedRole === 'ceo' ? 'CEO' : 'CTO'} Dashboard` : `Sign in to MPB Health ${selectedRole === 'ceo' ? 'CEO' : 'CTO'} Dashboard`}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700">{success}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
            {/* Name Field - Only for Sign Up */}
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field - Only for Sign Up */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500 transition-colors"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {/* Passcode Field - Only for Sign Up */}
            {isSignUp && (
              <div>
                <label htmlFor="passcode" className="block text-sm font-medium text-slate-700 mb-2">
                  Registration Passcode
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="passcode"
                    type={showPassword ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500 transition-colors"
                    placeholder="Enter registration passcode"
                  />
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-pink-600 focus:ring-sky-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-pink-600 hover:text-pink-500 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r ${getRoleColor(selectedRole)} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${selectedRole === 'ceo' ? 'focus:ring-emerald-500' : 'focus:ring-sky-500'} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </motion.button>
            
            {/* Toggle between Login/Signup */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={toggleAuthMode}
                className={`${getRoleTextColor(selectedRole)} hover:opacity-80 text-sm font-medium transition-opacity`}
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : 'Need an account? Sign Up'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              © 2025 MPB Health. All rights reserved.
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${selectedRole === 'ceo' ? 'from-emerald-400 to-teal-500' : 'from-sky-400 to-blue-500'} rounded-full opacity-20 blur-xl`}></div>
        <div className={`absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br ${selectedRole === 'ceo' ? 'from-teal-400 to-emerald-500' : 'from-blue-400 to-cyan-500'} rounded-full opacity-20 blur-xl`}></div>
      </motion.div>
    </div>
  );
}