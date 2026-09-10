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
    <section className="rounded-[2rem] bg-aryx-ink/5 p-1.5 ring-1 ring-aryx-line">
      <div className="rounded-[calc(2rem-0.375rem)] bg-aryx-elevated p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-aryx-faint">{title}</h2>
          {href && (
            <Link to={href} className="text-[10px] uppercase tracking-[0.16em] text-aryx-accent">
              Open
            </Link>
          )}
        </div>
        {warning && (
          <p className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            {warning}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">{children}</div>
      </div>
    </section>
  );
}

export function CommandStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-aryx-faint">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-aryx-faint">{hint}</p>}
    </div>
  );
}
