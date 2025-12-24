/**
 * CTO Dashboard Layout
 * Wraps all /cto/* routes with CTO-specific styling
 */
export default function CTOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-50 dark:from-slate-950 dark:via-sky-950/20 dark:to-slate-950">
      {children}
    </div>
  );
}

