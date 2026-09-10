import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AryxLogo } from './AryxLogo';
import { ThemeToggle } from './ThemeToggle';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] bg-aryx-bg text-aryx-ink">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-aryx-accent/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-aryx-gold/10 blur-3xl" />
      </div>

      <aside className="relative hidden w-[42%] flex-col justify-between bg-[#0B0B0D] px-12 py-10 text-[#F4F1EA] lg:flex">
        <AryxLogo size="lg" wordmark tone="onDark" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#FFC300]">ARYX CEO</p>
          <h2 className="mt-4 max-w-sm font-display text-5xl font-semibold leading-tight text-[#F4F1EA]">
            One login.<br />One workspace.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#F4F1EA]/60">
            Mail, CRM, and company operations on the same Aryx identity as Orbit.
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#F4F1EA]/35">Part of the ARYX ecosystem</p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <ThemeToggle className="absolute right-4 top-4 sm:right-8 sm:top-8" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="relative w-full max-w-md"
        >
          <div className="mb-6 flex justify-center lg:hidden">
            <AryxLogo wordmark />
          </div>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
