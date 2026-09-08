import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { isSupabaseConfigured, setRememberMePreference, isRememberMeEnabled } from '../../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login({ onLoginSuccess }: { onLoginSuccess?: () => void } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, signIn: authSignIn, signUp, loading, profileReady } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (location.pathname !== '/login') return;
    if (hasRedirected.current) return;
    if (!loading && profileReady && user) {
      hasRedirected.current = true;
      navigate('/home', { replace: true });
    }
  }, [profile, user, loading, profileReady, navigate, location.pathname]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('mpb_remembered_email');
    if (savedEmail) setEmail(savedEmail);
    if (isRememberMeEnabled()) setRememberMe(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (rememberMe) localStorage.setItem('mpb_remembered_email', email);
      else localStorage.removeItem('mpb_remembered_email');
      setRememberMePreference(rememberMe);
      await authSignIn(email, password);
      onLoginSuccess?.();
      setSuccess('Signed in.');
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signUp(email, password);
      setSuccess('Account created. You can sign in now.');
      setIsSignUp(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-[#050505] px-4 py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-md"
      >
        <p className="mb-4 text-center text-[10px] uppercase tracking-[0.22em] text-white/40">Aryx Chief of Staff</p>
        <div className="rounded-[2rem] bg-white/5 p-1.5 ring-1 ring-white/10">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            <h1 className="text-3xl font-semibold text-white">{isSignUp ? 'Create access' : 'Welcome back'}</h1>
            <p className="mt-2 text-sm text-white/45">One login. One COS workspace.</p>

            {!isSupabaseConfigured && (
              <p className="mt-4 text-sm text-amber-200/80">Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-300">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            {success && (
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle className="h-4 w-4" /> {success}
              </div>
            )}

            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="mt-8 space-y-5">
              <label className="block text-sm text-white/70">
                Email
                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none"
                  />
                </div>
              </label>
              <label className="block text-sm text-white/70">
                Password
                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-white outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <label className="flex items-center gap-2 text-xs text-white/40">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember email
              </label>
              <button
                type="submit"
                disabled={isLoading || !isSupabaseConfigured}
                className="w-full rounded-full bg-white py-3 text-sm font-medium text-black transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? 'Working…' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="mt-6 w-full text-center text-xs text-white/40"
            >
              {isSignUp ? 'Already have access? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
