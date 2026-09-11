import { Link } from 'react-router-dom';

const EASE = 'duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]';

export function CosPage({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative w-full min-w-0 bg-aryx-bg py-12 text-aryx-ink md:py-20 ${className}`}>
      <div className="cos-page w-full">{children}</div>
    </div>
  );
}

export function CosPageHero({
  eyebrow,
  title,
  lede,
  actions,
  toolbar,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
}) {
  return (
    <header className="cos-rise mb-10 md:mb-14">
      <p className="mb-5 inline-flex rounded-full bg-aryx-ink/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-aryx-muted ring-1 ring-aryx-line">
        {eyebrow}
      </p>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="font-display text-[2.35rem] font-semibold leading-[0.95] tracking-tight text-aryx-ink md:text-6xl">
            {title}
          </h1>
          {lede && (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-aryx-muted md:text-base">
              {lede}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {toolbar && (
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {toolbar}
        </div>
      )}
    </header>
  );
}

export function CosBezel({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`rounded-[2rem] bg-aryx-ink/[0.04] p-1.5 ring-1 ring-aryx-line ${className}`}>
      <div
        className={`rounded-[calc(2rem-0.375rem)] bg-aryx-elevated shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ${
          padded ? 'p-5 sm:p-6' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function CosTable({ children }: { children: React.ReactNode }) {
  return (
    <CosBezel padded={false}>
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1">
        <div className="min-w-[640px] p-5 sm:p-6">{children}</div>
      </div>
    </CosBezel>
  );
}

export function CosIslandButton({
  children,
  onClick,
  type = 'button',
  disabled,
  variant = 'accent',
  trailing = '↗',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'accent' | 'ghost';
  trailing?: string;
}) {
  const tone =
    variant === 'accent'
      ? 'bg-aryx-accent text-white'
      : 'bg-aryx-ink/[0.04] text-aryx-ink ring-1 ring-aryx-line';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex min-h-11 items-center gap-3 rounded-full py-2.5 pl-5 pr-1.5 text-sm font-medium ${tone} ${EASE} active:scale-[0.98] disabled:opacity-50`}
    >
      {children}
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${EASE} group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 ${
          variant === 'accent' ? 'bg-white/15' : 'bg-aryx-ink/5'
        }`}
      >
        {trailing}
      </span>
    </button>
  );
}

export function CosIslandLink({
  to,
  href,
  children,
  trailing = '↗',
}: {
  to?: string;
  href?: string;
  children: React.ReactNode;
  trailing?: string;
}) {
  const className = `group inline-flex min-h-11 items-center gap-3 rounded-full bg-aryx-ink/[0.04] py-2.5 pl-5 pr-1.5 text-sm font-medium text-aryx-ink ring-1 ring-aryx-line ${EASE} active:scale-[0.98]`;
  const mark = (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-aryx-ink/5 text-xs ${EASE} group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105`}
    >
      {trailing}
    </span>
  );
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
        {mark}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
      {mark}
    </a>
  );
}
