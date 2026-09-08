import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { validatePassword } from '../../lib/security';
import { PasswordStrengthIndicator } from '../security/PasswordStrengthIndicator';
import { AuthShell } from '../brand/AuthShell';

const fieldClass =
  'w-full rounded-full border border-aryx-line bg-aryx-bg py-3 pl-11 pr-12 text-aryx-ink outline-none placeholder:text-aryx-faint';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>();

  useEffect(() => {
    const establishSession = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session?.user) {
          setError('This reset link is invalid or expired. Request a new one from the login page.');
          return;
        }
        setEmail(data.session.user.email ?? undefined);
        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not open the reset link.');
      }
    };

    void establishSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePassword(password, undefined, { email });
    if (!validation.valid) {
      setError(validation.errors[0] || 'Password does not meet requirements.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      sessionStorage.removeItem('cos_password_recovery');
      setSuccess('Password updated. Opening COS…');
      setTimeout(() => navigate('/home', { replace: true }), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-[2rem] bg-aryx-ink/5 p-1.5 ring-1 ring-aryx-line">
        <div className="rounded-[calc(2rem-0.375rem)] bg-aryx-elevated p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
          <h1 className="font-display text-3xl font-semibold text-aryx-ink">Set a new password</h1>
          <p className="mt-2 text-sm text-aryx-muted">Use at least 12 characters with mixed case, a number, and a symbol.</p>

          {!isSupabaseConfigured && (
            <p className="mt-4 text-sm text-amber-700 dark:text-amber-200">Supabase is not configured.</p>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
          {success && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="h-4 w-4" /> {success}
            </div>
          )}

          {ready && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block text-sm text-aryx-muted">
                New password
                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-aryx-faint" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={fieldClass}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-aryx-faint">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <PasswordStrengthIndicator password={password} email={email} />
              <label className="block text-sm text-aryx-muted">
                Confirm password
                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-aryx-faint" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className={`${fieldClass} pr-4`}
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={isLoading || !isSupabaseConfigured}
                className="w-full rounded-full bg-aryx-accent py-3 text-sm font-medium text-white transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 w-full text-center text-xs text-aryx-faint"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
