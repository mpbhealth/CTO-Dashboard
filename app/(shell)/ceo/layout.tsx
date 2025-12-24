/**
 * CEO Dashboard Layout
 * Wraps all /ceo/* routes with CEO-specific styling
 */
export default function CEOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
      {children}
    </div>
  );
}

