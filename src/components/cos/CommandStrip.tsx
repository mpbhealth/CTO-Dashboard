import { Link } from 'react-router-dom';

export function CommandStrip({
  title,
  href,
  children,
  warning,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  warning?: string | null;
}) {
  return (
    <section className="cos-rise rounded-[2rem] bg-aryx-ink/[0.04] p-1.5 ring-1 ring-aryx-line">
      <div className="rounded-[calc(2rem-0.375rem)] bg-aryx-elevated p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-aryx-faint">{title}</h2>
          {href && (
            <Link
              to={href}
              className="group inline-flex min-h-9 items-center gap-2 rounded-full bg-aryx-ink/[0.04] py-1 pl-3.5 pr-1 text-[10px] uppercase tracking-[0.16em] text-aryx-muted transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              Open
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-aryx-ink/5 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
                ↗
              </span>
            </Link>
          )}
        </div>
        {warning && (
          <p className="mb-5 rounded-2xl bg-amber-500/10 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-500/30 dark:text-amber-200">
            {warning}
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 xs:grid-cols-2 xl:grid-cols-3">{children}</div>
      </div>
    </section>
  );
}

export function CommandStat({
  label,
  value,
  hint,
  featured,
}: {
  label: string;
  value: string;
  hint?: string;
  featured?: boolean;
}) {
  return (
    <div className={featured ? 'xs:col-span-2 xl:col-span-1' : undefined}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-aryx-ink md:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-aryx-faint">{hint}</p>}
    </div>
  );
}
