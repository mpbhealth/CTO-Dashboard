import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Building2, AlertCircle, CheckCircle, User, KeyRound, Briefcase, Code2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

type UserRole = 'ceo' | 'cto' | null;

export default function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const { isDemoMode, profile } = useAuth();
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

  useEffect(() => {
    if (isDemoMode && profile) {
      const redirectPath = profile.role === 'ceo' ? '/ceod/home' : '/ctod/home';
      navigate(redirectPath, { replace: true });
    }
  }, [isDemoMode, profile, navigate]);

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
    if (role === 'ceo') return 'from-slate-900 via-slate-800 to-slate-900';
    if (role === 'cto') return 'from-sky-600 to-blue-600';
    return 'from-slate-600 to-gray-600';
  };

  const getRoleBorderColor = (role: UserRole) => {
    if (role === 'ceo') return 'border-amber-500';
    if (role === 'cto') return 'border-sky-500';
    return 'border-slate-500';
  };

  const getRoleTextColor = (role: UserRole) => {
    if (role === 'ceo') return 'text-amber-600';
    if (role === 'cto') return 'text-sky-600';
    return 'text-slate-600';
  };

  const getRoleAccentColor = (role: UserRole) => {
    if (role === 'ceo') return 'from-amber-400 via-amber-500 to-yellow-600';
    if (role === 'cto') return 'from-sky-400 to-blue-500';
    return 'from-slate-400 to-gray-500';
  };

  if (!isSupabaseConfigured && !selectedRole) {
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
          <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-4">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-amber-300">Demo Mode Available</h2>
                <p className="text-amber-100 text-sm">Supabase is not configured. Select a role to explore the dashboard in demo mode.</p>
              </div>
            </div>
          </div>

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
              Select your role to continue in demo mode
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.button
              onClick={() => {
                window.location.href = '/?demo_role=ceo';
              }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-gradient-to-br from-slate-900 via-slate-800 to-black backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-amber-500/30 hover:border-amber-500 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity"></div>

              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl group-hover:shadow-amber-500/50 transition-all duration-300 border border-amber-400/30">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <div className="mb-3">
                  <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full mb-3">
                    <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Executive Suite</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">CEO Demo</h2>
                <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                  Strategic command center with executive insights, comprehensive analytics, and board-level intelligence
                </p>
                <div className="flex items-center justify-center text-amber-400 font-semibold group-hover:text-amber-300 transition-colors">
                  <span className="tracking-wide">Try Executive Demo</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => {
                window.location.href = '/?demo_role=cto';
              }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-transparent hover:border-pink-500 transition-all duration-300"
            >
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-sky-500/50 transition-shadow">
                  <Code2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">CTO Demo</h2>
                <p className="text-slate-600 mb-6">
                  Technical dashboard with engineering metrics, system monitoring, and operational insights
                </p>
                <div className="flex items-center justify-center text-pink-600 font-medium group-hover:text-pink-700">
                  Try CTO Demo
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
              className="group relative bg-gradient-to-br from-slate-900 via-slate-800 to-black backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-amber-500/30 hover:border-amber-500 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity"></div>

              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl group-hover:shadow-amber-500/50 transition-all duration-300 border border-amber-400/30">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <div className="mb-3">
                  <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full mb-3">
                    <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Executive Suite</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">CEO Portal</h2>
                <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                  Strategic command center with executive insights, comprehensive analytics, and board-level intelligence
                </p>
                <div className="flex items-center justify-center text-amber-400 font-semibold group-hover:text-amber-300 transition-colors">
                  <span className="tracking-wide">Access Executive Suite</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => handleRoleSelect('cto')}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-transparent hover:border-sky-500 transition-all duration-300"
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
                <div className="flex items-center justify-center text-sky-600 font-medium group-hover:text-sky-700">
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
    <div className={`min-h-screen bg-gradient-to-br ${selectedRole === 'ceo' ? 'from-black via-slate-900 to-slate-800' : 'from-slate-900 via-slate-800 to-sky-900'} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Executive Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${selectedRole === 'ceo' ? 'fbbf24' : 'ffffff'}' fill-opacity='0.05'%3E%3Cpath d='M40 0L40 40L0 40z'/%3E%3Cpath d='M80 40L40 40L40 80z' transform='rotate(180 60 60)'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      {selectedRole === 'ceo' && (
        <>
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-yellow-600/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-lg"
      >
        {/* Executive Login Card */}
        <div className={`${selectedRole === 'ceo' ? 'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border-amber-500/20' : 'bg-white/95 border-white/20'} backdrop-blur-xl rounded-3xl shadow-2xl p-10 border-2`}>
          {/* Header */}
          <div className="text-center mb-10">
            <button
              onClick={() => setSelectedRole(null)}
              className={`absolute top-6 left-6 ${selectedRole === 'ceo' ? 'text-amber-400/60 hover:text-amber-400' : 'text-slate-400 hover:text-slate-600'} transition-colors text-sm flex items-center space-x-1 font-medium`}
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
              className={`w-20 h-20 bg-gradient-to-br ${selectedRole === 'ceo' ? 'from-amber-500 via-amber-600 to-yellow-700 border-2 border-amber-400/30' : getRoleColor(selectedRole)} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl`}
            >
              {selectedRole === 'ceo' ? (
                <Briefcase className="w-10 h-10 text-white" />
              ) : (
                <Code2 className="w-10 h-10 text-white" />
              )}
            </motion.div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 ${selectedRole === 'ceo' ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30' : 'text-sky-600 bg-sky-100 border border-sky-200'}`}>
              {selectedRole === 'ceo' ? 'Executive Suite' : 'CTO Portal'}
            </div>
            <h1 className={`text-3xl font-bold mb-3 tracking-tight ${selectedRole === 'ceo' ? 'text-white' : 'text-slate-900'}`}>
              {isSignUp ? 'Create Executive Account' : 'Welcome Back'}
            </h1>
            <p className={`text-sm leading-relaxed ${selectedRole === 'ceo' ? 'text-slate-300' : 'text-slate-600'}`}>
              {isSignUp
                ? `Join the MPB Health ${selectedRole === 'ceo' ? 'Executive Leadership' : 'Technical Leadership'} Portal`
                : `Access your ${selectedRole === 'ceo' ? 'Executive Command Center' : 'Technical Dashboard'}`}
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
                <label htmlFor="name" className={`block text-sm font-semibold mb-2 ${selectedRole === 'ceo' ? 'text-slate-200' : 'text-slate-700'}`}>
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 ${selectedRole === 'ceo' ? 'text-amber-400/40' : 'text-slate-400'}`} />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={`block w-full pl-12 pr-4 py-3.5 rounded-xl transition-all ${
                      selectedRole === 'ceo'
                        ? 'bg-slate-800/50 border-2 border-amber-500/20 text-white placeholder-slate-400 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'
                        : 'bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-2 ${selectedRole === 'ceo' ? 'text-slate-200' : 'text-slate-700'}`}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${selectedRole === 'ceo' ? 'text-amber-400/40' : 'text-slate-400'}`} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`block w-full pl-12 pr-4 py-3.5 rounded-xl transition-all ${
                    selectedRole === 'ceo'
                      ? 'bg-slate-800/50 border-2 border-amber-500/20 text-white placeholder-slate-400 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'
                      : 'bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={`block text-sm font-semibold mb-2 ${selectedRole === 'ceo' ? 'text-slate-200' : 'text-slate-700'}`}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${selectedRole === 'ceo' ? 'text-amber-400/40' : 'text-slate-400'}`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`block w-full pl-12 pr-14 py-3.5 rounded-xl transition-all ${
                    selectedRole === 'ceo'
                      ? 'bg-slate-800/50 border-2 border-amber-500/20 text-white placeholder-slate-400 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'
                      : 'bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className={`h-5 w-5 ${selectedRole === 'ceo' ? 'text-amber-400/60 hover:text-amber-400' : 'text-slate-400 hover:text-slate-600'} transition-colors`} />
                  ) : (
                    <Eye className={`h-5 w-5 ${selectedRole === 'ceo' ? 'text-amber-400/60 hover:text-amber-400' : 'text-slate-400 hover:text-slate-600'} transition-colors`} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field - Only for Sign Up */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-semibold mb-2 ${selectedRole === 'ceo' ? 'text-slate-200' : 'text-slate-700'}`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${selectedRole === 'ceo' ? 'text-amber-400/40' : 'text-slate-400'}`} />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`block w-full pl-12 pr-4 py-3.5 rounded-xl transition-all ${
                      selectedRole === 'ceo'
                        ? 'bg-slate-800/50 border-2 border-amber-500/20 text-white placeholder-slate-400 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'
                        : 'bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {/* Passcode Field - Only for Sign Up */}
            {isSignUp && (
              <div>
                <label htmlFor="passcode" className={`block text-sm font-semibold mb-2 ${selectedRole === 'ceo' ? 'text-slate-200' : 'text-slate-700'}`}>
                  Registration Passcode
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className={`h-5 w-5 ${selectedRole === 'ceo' ? 'text-amber-400/40' : 'text-slate-400'}`} />
                  </div>
                  <input
                    id="passcode"
                    type={showPassword ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                    className={`block w-full pl-12 pr-4 py-3.5 rounded-xl transition-all ${
                      selectedRole === 'ceo'
                        ? 'bg-slate-800/50 border-2 border-amber-500/20 text-white placeholder-slate-400 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'
                        : 'bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                    placeholder="Enter registration passcode"
                  />
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            {!isSignUp && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className={`h-4 w-4 rounded border-2 transition-colors ${
                      selectedRole === 'ceo'
                        ? 'text-amber-500 focus:ring-amber-500 border-amber-500/30 bg-slate-800'
                        : 'text-amber-600 focus:ring-amber-500 border-slate-300'
                    }`}
                  />
                  <label htmlFor="remember-me" className={`ml-2 block text-sm font-medium ${selectedRole === 'ceo' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className={`text-sm font-semibold transition-colors ${
                    selectedRole === 'ceo'
                      ? 'text-amber-400 hover:text-amber-300'
                      : 'text-amber-600 hover:text-amber-500'
                  }`}
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
              className={`w-full flex justify-center py-4 px-6 border-2 rounded-xl shadow-lg text-base font-bold transition-all duration-300 ${
                selectedRole === 'ceo'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:via-amber-500 hover:to-yellow-500 text-white border-amber-400/30 shadow-amber-500/20 hover:shadow-amber-500/40'
                  : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white border-sky-500/30 shadow-sky-500/20 hover:shadow-sky-500/40'
              } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 ${
                selectedRole === 'ceo' ? 'focus:ring-amber-500/30' : 'focus:ring-sky-500/30'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                </div>
              ) : (
                <span className="tracking-wide">{isSignUp ? 'Create Executive Account' : 'Access Executive Suite'}</span>
              )}
            </motion.button>
            
            {/* Toggle between Login/Signup */}
            <div className="text-center mt-6 pt-6 border-t border-slate-700/30">
              <button
                type="button"
                onClick={toggleAuthMode}
                className={`text-sm font-semibold transition-colors ${
                  selectedRole === 'ceo'
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-amber-600 hover:text-amber-500'
                }`}
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : 'Need an account? Sign Up'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700/30 text-center">
            <p className={`text-xs font-medium ${selectedRole === 'ceo' ? 'text-slate-500' : 'text-slate-500'}`}>
              © 2025 MPB Health. All rights reserved.
            </p>
          </div>
        </div>

        {/* Premium Floating Elements */}
        <div className={`absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br ${selectedRole === 'ceo' ? 'from-amber-400/20 via-amber-500/10 to-yellow-600/20' : 'from-sky-400/20 to-blue-500/20'} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-8 -left-8 w-48 h-48 bg-gradient-to-br ${selectedRole === 'ceo' ? 'from-yellow-400/20 via-amber-500/10 to-amber-600/20' : 'from-blue-400/20 to-cyan-500/20'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }}></div>
      </motion.div>
    </div>
  );
}