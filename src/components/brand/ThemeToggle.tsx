import { useEffect, useState } from 'react';
import { getPreferredTheme, toggleTheme, type ThemeMode } from '../../lib/theme';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>(() => getPreferredTheme());

  useEffect(() => {
    setMode(getPreferredTheme());
  }, []);

  return (
    <button
      type="button"
      onClick={() => setMode(toggleTheme())}
      className={`rounded-full border border-aryx-line bg-aryx-elevated px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-aryx-muted transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${className}`}
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
